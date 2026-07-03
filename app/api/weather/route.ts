import { z } from "zod";
import {
  formatZodIssues,
  jsonError,
  jsonOk,
  safeUpstreamMessage,
} from "@/lib/api-response";

export const dynamic = "force-dynamic";

const weatherQuerySchema = z
  .object({
    city: z.string().trim().min(2).max(120).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lon: z.coerce.number().min(-180).max(180).optional(),
  })
  .superRefine((value, ctx) => {
    const hasCity = Boolean(value.city);
    const hasCoordinates = value.lat !== undefined && value.lon !== undefined;

    if (!hasCity && !hasCoordinates) {
      ctx.addIssue({
        code: "custom",
        message: "Provide a city or both latitude and longitude.",
        path: ["city"],
      });
    }

    if (!hasCity && value.lat !== undefined && value.lon === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Longitude is required when latitude is provided.",
        path: ["lon"],
      });
    }

    if (!hasCity && value.lon !== undefined && value.lat === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Latitude is required when longitude is provided.",
        path: ["lat"],
      });
    }
  });

const geocodeSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        country: z.string().optional(),
        admin1: z.string().optional(),
      }),
    )
    .optional(),
});

const forecastSchema = z.object({
  timezone: z.string(),
  current: z.object({
    temperature_2m: z.number(),
    weather_code: z.number(),
    wind_speed_10m: z.number().optional(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
  }),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = weatherQuerySchema.safeParse({
    city: searchParams.get("city") ?? undefined,
    lat: searchParams.get("lat") ?? undefined,
    lon: searchParams.get("lon") ?? undefined,
  });

  if (!parsed.success) {
    return jsonError(
      "invalid_weather_query",
      "Weather lookup needs a valid city or coordinate pair.",
      422,
      formatZodIssues(parsed.error),
    );
  }

  try {
    const location = parsed.data.city
      ? await resolveCity(parsed.data.city)
      : {
          name: "Custom coordinates",
          latitude: parsed.data.lat as number,
          longitude: parsed.data.lon as number,
          country: undefined,
          admin1: undefined,
        };

    if (!location) {
      return jsonError(
        "location_not_found",
        "No matching location was found for that city.",
        404,
      );
    }

    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
    forecastUrl.searchParams.set("latitude", String(location.latitude));
    forecastUrl.searchParams.set("longitude", String(location.longitude));
    forecastUrl.searchParams.set(
      "current",
      "temperature_2m,weather_code,wind_speed_10m",
    );
    forecastUrl.searchParams.set(
      "daily",
      "weather_code,temperature_2m_max,temperature_2m_min",
    );
    forecastUrl.searchParams.set("forecast_days", "5");
    forecastUrl.searchParams.set("timezone", "auto");

    const forecastResponse = await fetch(forecastUrl, { cache: "no-store" });

    if (!forecastResponse.ok) {
      return jsonError(
        "weather_unavailable",
        safeUpstreamMessage("Open-Meteo"),
        502,
      );
    }

    const forecast = forecastSchema.parse(await forecastResponse.json());

    return jsonOk({
      location: {
        name: location.name,
        country: location.country,
        region: location.admin1,
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: forecast.timezone,
      },
      current: {
        temperatureC: forecast.current.temperature_2m,
        windSpeedKph: forecast.current.wind_speed_10m ?? null,
        weatherCode: forecast.current.weather_code,
        condition: describeWeather(forecast.current.weather_code),
      },
      forecast: forecast.daily.time.map((date, index) => ({
        date,
        highC: forecast.daily.temperature_2m_max[index],
        lowC: forecast.daily.temperature_2m_min[index],
        weatherCode: forecast.daily.weather_code[index],
        condition: describeWeather(forecast.daily.weather_code[index]),
      })),
    });
  } catch {
    return jsonError(
      "weather_unavailable",
      safeUpstreamMessage("Open-Meteo"),
      502,
    );
  }
}

async function resolveCity(city: string) {
  const geocodeUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geocodeUrl.searchParams.set("name", city);
  geocodeUrl.searchParams.set("count", "1");
  geocodeUrl.searchParams.set("language", "en");
  geocodeUrl.searchParams.set("format", "json");

  const response = await fetch(geocodeUrl, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Geocoding request failed.");
  }

  const payload = geocodeSchema.parse(await response.json());
  return payload.results?.[0] ?? null;
}

function describeWeather(code: number) {
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Mixed conditions";
}
