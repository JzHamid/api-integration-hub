import { jsonOk } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  return jsonOk({
    status: "operational",
    services: [
      {
        name: "Route handlers",
        status: "operational",
        latencyMs: 18,
        route: "/api/health",
      },
      {
        name: "Validation",
        status: "operational",
        latencyMs: 7,
        route: "Zod schemas",
      },
      {
        name: "Mock CRM store",
        status: "operational",
        latencyMs: 11,
        route: "/api/clients",
      },
      {
        name: "External API proxy",
        status: "degraded-safe",
        latencyMs: 240,
        route: "GitHub + Open-Meteo",
      },
    ],
  });
}
