"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { JsonPreview } from "@/components/json-preview";
import { StatusBadge } from "@/components/status-badge";
import {
  integrationSummaries,
  requestLogs,
  type Client,
  type Task,
} from "@/lib/mock-data";

type ApiEnvelope<T> =
  | {
      ok: true;
      data: T;
      meta: Record<string, unknown>;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
      meta: Record<string, unknown>;
    };

type HealthPayload = {
  status: string;
  services: Array<{
    name: string;
    status: string;
    latencyMs: number;
    route: string;
  }>;
};

type GithubPayload = {
  profile: {
    login: string;
    name: string | null;
    avatar_url: string;
    html_url: string;
    bio: string | null;
    company: string | null;
    location: string | null;
    blog: string | null;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
  };
  repositories: Array<{
    id: number;
    name: string;
    html_url: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    updated_at: string;
  }>;
  repoWarning: string | null;
};

type WeatherPayload = {
  location: {
    name: string;
    country?: string;
    region?: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  current: {
    temperatureC: number;
    windSpeedKph: number | null;
    weatherCode: number;
    condition: string;
  };
  forecast: Array<{
    date: string;
    highC: number;
    lowC: number;
    weatherCode: number;
    condition: string;
  }>;
};

type CrmPayload = {
  clients: Client[];
  tasks: Task[];
};

type WebhookPayload = {
  lastWebhook: Record<string, unknown> | null;
};

class ApiClientError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.payload = payload;
  }
}

const sampleWebhookPayload = JSON.stringify(
  {
    event: "client.created",
    source: "portfolio-demo",
    occurredAt: "2026-07-02T17:00:00.000Z",
    data: {
      clientId: "client_1002",
      plan: "growth",
      seats: 4,
    },
  },
  null,
  2,
);

const statCards = [
  {
    label: "Integrations",
    value: "4",
    detail: "GitHub, weather, CRM, webhook",
    tone: "text-cyan-200",
  },
  {
    label: "Route handlers",
    value: "8",
    detail: "GET, POST, validation, health",
    tone: "text-emerald-200",
  },
  {
    label: "Validated POST APIs",
    value: "4",
    detail: "Clients, tasks, contact, webhook",
    tone: "text-amber-200",
  },
  {
    label: "External APIs",
    value: "2",
    detail: "Server-side API proxy pattern",
    tone: "text-rose-200",
  },
];

export function ApiDashboard() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [githubUsername, setGithubUsername] = useState("octocat");
  const [githubResult, setGithubResult] = useState<GithubPayload | null>(null);
  const [githubRaw, setGithubRaw] = useState<unknown>(null);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);

  const [weatherMode, setWeatherMode] = useState<"city" | "coordinates">(
    "city",
  );
  const [weatherCity, setWeatherCity] = useState("New York");
  const [weatherLat, setWeatherLat] = useState("40.7128");
  const [weatherLon, setWeatherLon] = useState("-74.0060");
  const [weatherResult, setWeatherResult] = useState<WeatherPayload | null>(
    null,
  );
  const [weatherRaw, setWeatherRaw] = useState<unknown>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [crmRaw, setCrmRaw] = useState<unknown>(null);
  const [crmError, setCrmError] = useState<string | null>(null);
  const [crmLoading, setCrmLoading] = useState(true);
  const [newClient, setNewClient] = useState({
    name: "Jordan Lee",
    company: "Circuit Works",
    email: "jordan@circuitworks.example",
  });
  const [newTask, setNewTask] = useState({
    title: "Qualify webhook lead",
    owner: "Jazhem",
    priority: "medium",
    dueDate: "2026-07-12",
  });

  const [contact, setContact] = useState({
    name: "Avery Morgan",
    email: "avery@example.com",
    message: "I would like to talk about connecting our internal tools.",
  });
  const [contactRaw, setContactRaw] = useState<unknown>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  const [webhookBody, setWebhookBody] = useState(sampleWebhookPayload);
  const [webhookRaw, setWebhookRaw] = useState<unknown>(null);
  const [webhookLast, setWebhookLast] = useState<Record<string, unknown> | null>(
    null,
  );
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);

  const crmSnapshot = useMemo<CrmPayload>(
    () => ({ clients, tasks }),
    [clients, tasks],
  );

  useEffect(() => {
    void loadHealth();
    void loadCrm();
    void loadWebhook();
  }, []);

  async function loadHealth() {
    try {
      const { data } = await fetchApi<HealthPayload>("/api/health");
      setHealth(data);
      setHealthError(null);
    } catch (error) {
      setHealthError(readErrorMessage(error));
    }
  }

  async function loadCrm() {
    setCrmLoading(true);
    setCrmError(null);

    try {
      const [clientResponse, taskResponse] = await Promise.all([
        fetchApi<{ clients: Client[]; total: number }>("/api/clients"),
        fetchApi<{ tasks: Task[]; total: number }>("/api/tasks"),
      ]);

      setClients(clientResponse.data.clients);
      setTasks(taskResponse.data.tasks);
      setCrmRaw({
        clients: clientResponse.payload,
        tasks: taskResponse.payload,
      });
    } catch (error) {
      captureApiError(error, setCrmError, setCrmRaw);
    } finally {
      setCrmLoading(false);
    }
  }

  async function loadWebhook() {
    try {
      const { data, payload } = await fetchApi<WebhookPayload>("/api/webhook");
      setWebhookLast(data.lastWebhook);
      setWebhookRaw(payload);
      setWebhookError(null);
    } catch (error) {
      captureApiError(error, setWebhookError, setWebhookRaw);
    }
  }

  async function handleGithubSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = githubUsername.trim();

    if (!username) {
      setGithubError("Enter a GitHub username.");
      return;
    }

    setGithubLoading(true);
    setGithubError(null);

    try {
      const { data, payload } = await fetchApi<GithubPayload>(
        `/api/github/${encodeURIComponent(username)}`,
      );
      setGithubResult(data);
      setGithubRaw(payload);
    } catch (error) {
      setGithubResult(null);
      captureApiError(error, setGithubError, setGithubRaw);
    } finally {
      setGithubLoading(false);
    }
  }

  async function handleWeatherSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();

    if (weatherMode === "city") {
      params.set("city", weatherCity.trim());
    } else {
      params.set("lat", weatherLat.trim());
      params.set("lon", weatherLon.trim());
    }

    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const { data, payload } = await fetchApi<WeatherPayload>(
        `/api/weather?${params.toString()}`,
      );
      setWeatherResult(data);
      setWeatherRaw(payload);
    } catch (error) {
      setWeatherResult(null);
      captureApiError(error, setWeatherError, setWeatherRaw);
    } finally {
      setWeatherLoading(false);
    }
  }

  async function handleClientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCrmLoading(true);
    setCrmError(null);

    try {
      const { payload } = await fetchApi<{ client: Client }>("/api/clients", {
        method: "POST",
        body: JSON.stringify({
          ...newClient,
          status: "prospect",
          source: "Dashboard form",
        }),
      });
      setCrmRaw(payload);
      await loadCrm();
    } catch (error) {
      captureApiError(error, setCrmError, setCrmRaw);
      setCrmLoading(false);
    }
  }

  async function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCrmLoading(true);
    setCrmError(null);

    try {
      const { payload } = await fetchApi<{ task: Task }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          ...newTask,
          status: "open",
        }),
      });
      setCrmRaw(payload);
      await loadCrm();
    } catch (error) {
      captureApiError(error, setCrmError, setCrmRaw);
      setCrmLoading(false);
    }
  }

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContactLoading(true);
    setContactError(null);

    try {
      const { payload } = await fetchApi("/api/contact", {
        method: "POST",
        body: JSON.stringify(contact),
      });
      setContactRaw(payload);
    } catch (error) {
      captureApiError(error, setContactError, setContactRaw);
    } finally {
      setContactLoading(false);
    }
  }

  async function handleWebhookSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWebhookLoading(true);
    setWebhookError(null);

    try {
      const { data, payload } = await fetchApi<{ webhook: Record<string, unknown> }>(
        "/api/webhook",
        {
          method: "POST",
          body: webhookBody,
        },
      );
      setWebhookLast(data.webhook);
      setWebhookRaw(payload);
    } catch (error) {
      captureApiError(error, setWebhookError, setWebhookRaw);
    } finally {
      setWebhookLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="grid gap-6 border-b border-white/10 pb-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <StatusBadge variant="info">API Integration Hub</StatusBadge>
              <StatusBadge variant="success">Phase 1</StatusBadge>
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Portfolio API console for route handlers, integrations, and
              validation.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              A full-stack developer dashboard for GitHub, Open-Meteo, internal
              CRM APIs, contact intake, webhooks, and consistent JSON responses.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((card) => (
              <section
                key={card.label}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {card.label}
                </p>
                <p className={`mt-3 text-3xl font-semibold ${card.tone}`}>
                  {card.value}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {card.detail}
                </p>
              </section>
            ))}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {integrationSummaries.map((integration) => (
            <article
              key={integration.name}
              className="rounded-lg border border-white/10 bg-[#0b111c] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-white">
                  {integration.name}
                </h2>
                <StatusBadge
                  variant={
                    integration.status === "Live"
                      ? "success"
                      : integration.status === "Mocked"
                        ? "warning"
                        : "info"
                  }
                >
                  {integration.status}
                </StatusBadge>
              </div>
              <p className="mt-3 font-mono text-xs text-cyan-200">
                {integration.route}
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                {integration.description}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel
            eyebrow="Health"
            title="API Status"
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => void loadHealth()}
              >
                Refresh
              </Button>
            }
          >
            {healthError ? (
              <Alert tone="error">{healthError}</Alert>
            ) : health ? (
              <div className="space-y-3">
                {health.services.map((service) => (
                  <div
                    key={service.name}
                    className="grid gap-3 border-b border-white/10 py-3 last:border-b-0 sm:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="font-medium text-white">{service.name}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {service.route}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <StatusBadge
                        variant={
                          service.status === "operational"
                            ? "success"
                            : "warning"
                        }
                      >
                        {service.status}
                      </StatusBadge>
                      <span className="font-mono text-xs text-slate-400">
                        {service.latencyMs}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <LoadingRows />
            )}
          </Panel>

          <Panel eyebrow="Traffic" title="Recent Request Log">
            <div className="overflow-hidden rounded-lg border border-white/10">
              <div className="grid grid-cols-[0.6fr_1.5fr_0.5fr_0.6fr] gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                <span>Method</span>
                <span>Path</span>
                <span>Status</span>
                <span>Time</span>
              </div>
              {requestLogs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-[0.6fr_1.5fr_0.5fr_0.6fr] gap-3 border-b border-white/10 px-4 py-3 text-sm last:border-b-0"
                >
                  <span className="font-mono text-cyan-200">{log.method}</span>
                  <span className="min-w-0 truncate font-mono text-slate-300">
                    {log.path}
                  </span>
                  <span
                    className={
                      log.status >= 400 ? "text-rose-200" : "text-emerald-200"
                    }
                  >
                    {log.status}
                  </span>
                  <span className="text-slate-500">{log.time}</span>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Panel eyebrow="External API" title="GitHub Lookup">
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleGithubSubmit}>
              <TextInput
                label="Username"
                value={githubUsername}
                onChange={setGithubUsername}
                placeholder="octocat"
              />
              <div className="sm:self-end">
                <Button type="submit" loading={githubLoading}>
                  Lookup
                </Button>
              </div>
            </form>

            {githubError ? <Alert tone="error">{githubError}</Alert> : null}

            {githubResult ? (
              <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={githubResult.profile.avatar_url}
                      alt=""
                      className="h-16 w-16 rounded-lg border border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-white">
                        {githubResult.profile.name ?? githubResult.profile.login}
                      </p>
                      <a
                        href={githubResult.profile.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-sm text-cyan-200 hover:text-cyan-100"
                      >
                        @{githubResult.profile.login}
                      </a>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    {githubResult.profile.bio ?? "No public bio available."}
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <Metric label="Repos" value={githubResult.profile.public_repos} />
                    <Metric label="Followers" value={githubResult.profile.followers} />
                    <Metric label="Following" value={githubResult.profile.following} />
                  </div>
                </div>

                <div className="space-y-3">
                  {githubResult.repoWarning ? (
                    <Alert tone="warning">{githubResult.repoWarning}</Alert>
                  ) : null}
                  {githubResult.repositories.length ? (
                    githubResult.repositories.map((repo) => (
                      <a
                        key={repo.id}
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.04]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold text-white">{repo.name}</p>
                          <span className="font-mono text-xs text-amber-200">
                            {repo.stargazers_count} stars
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                          {repo.description ?? "No description provided."}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>{repo.language ?? "Unknown"}</span>
                          <span>{repo.forks_count} forks</span>
                          <span>{formatDate(repo.updated_at)}</span>
                        </div>
                      </a>
                    ))
                  ) : (
                    <EmptyState>No public repositories returned.</EmptyState>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState>Lookup results will appear here.</EmptyState>
            )}

            <JsonPreview value={githubRaw} />
          </Panel>

          <Panel eyebrow="External API" title="Weather Lookup">
            <form className="space-y-4" onSubmit={handleWeatherSubmit}>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-black/20 p-1">
                <SegmentButton
                  active={weatherMode === "city"}
                  onClick={() => setWeatherMode("city")}
                >
                  City
                </SegmentButton>
                <SegmentButton
                  active={weatherMode === "coordinates"}
                  onClick={() => setWeatherMode("coordinates")}
                >
                  Coordinates
                </SegmentButton>
              </div>

              {weatherMode === "city" ? (
                <TextInput
                  label="City"
                  value={weatherCity}
                  onChange={setWeatherCity}
                  placeholder="New York"
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    label="Latitude"
                    value={weatherLat}
                    onChange={setWeatherLat}
                    placeholder="40.7128"
                  />
                  <TextInput
                    label="Longitude"
                    value={weatherLon}
                    onChange={setWeatherLon}
                    placeholder="-74.0060"
                  />
                </div>
              )}

              <Button type="submit" loading={weatherLoading}>
                Fetch Forecast
              </Button>
            </form>

            {weatherError ? <Alert tone="error">{weatherError}</Alert> : null}

            {weatherResult ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xl font-semibold text-white">
                      {weatherResult.location.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {[weatherResult.location.region, weatherResult.location.country]
                        .filter(Boolean)
                        .join(", ") || "Coordinate lookup"}
                    </p>
                    <p className="mt-3 font-mono text-xs text-slate-500">
                      {weatherResult.location.latitude.toFixed(4)},{" "}
                      {weatherResult.location.longitude.toFixed(4)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-4xl font-semibold text-cyan-100">
                      {Math.round(weatherResult.current.temperatureC)}C
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {weatherResult.current.condition}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Wind {weatherResult.current.windSpeedKph ?? "n/a"} kph
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-5">
                  {weatherResult.forecast.map((day) => (
                    <div
                      key={day.date}
                      className="rounded-lg border border-white/10 bg-black/20 p-3"
                    >
                      <p className="text-xs text-slate-500">{formatDate(day.date)}</p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {Math.round(day.highC)} / {Math.round(day.lowC)}C
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{day.condition}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState>Forecast results will appear here.</EmptyState>
            )}

            <JsonPreview value={weatherRaw} />
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel
            eyebrow="Internal API"
            title="Mock CRM"
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => void loadCrm()}
              >
                Reload
              </Button>
            }
          >
            {crmError ? <Alert tone="error">{crmError}</Alert> : null}

            <div className="grid gap-4 lg:grid-cols-2">
              <form className="space-y-3" onSubmit={handleClientSubmit}>
                <h3 className="text-sm font-semibold text-white">Create Client</h3>
                <TextInput
                  label="Name"
                  value={newClient.name}
                  onChange={(value) =>
                    setNewClient((current) => ({ ...current, name: value }))
                  }
                />
                <TextInput
                  label="Company"
                  value={newClient.company}
                  onChange={(value) =>
                    setNewClient((current) => ({ ...current, company: value }))
                  }
                />
                <TextInput
                  label="Email"
                  type="email"
                  value={newClient.email}
                  onChange={(value) =>
                    setNewClient((current) => ({ ...current, email: value }))
                  }
                />
                <Button type="submit" loading={crmLoading}>
                  POST /api/clients
                </Button>
              </form>

              <form className="space-y-3" onSubmit={handleTaskSubmit}>
                <h3 className="text-sm font-semibold text-white">Create Task</h3>
                <TextInput
                  label="Title"
                  value={newTask.title}
                  onChange={(value) =>
                    setNewTask((current) => ({ ...current, title: value }))
                  }
                />
                <TextInput
                  label="Owner"
                  value={newTask.owner}
                  onChange={(value) =>
                    setNewTask((current) => ({ ...current, owner: value }))
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectInput
                    label="Priority"
                    value={newTask.priority}
                    onChange={(value) =>
                      setNewTask((current) => ({ ...current, priority: value }))
                    }
                    options={["low", "medium", "high"]}
                  />
                  <TextInput
                    label="Due Date"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(value) =>
                      setNewTask((current) => ({ ...current, dueDate: value }))
                    }
                  />
                </div>
                <Button type="submit" loading={crmLoading}>
                  POST /api/tasks
                </Button>
              </form>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <RecordList
                title="Clients"
                empty="No clients returned."
                records={clients.map((client) => ({
                  id: client.id,
                  title: client.name,
                  detail: client.company,
                  meta: client.status,
                }))}
              />
              <RecordList
                title="Tasks"
                empty="No tasks returned."
                records={tasks.map((task) => ({
                  id: task.id,
                  title: task.title,
                  detail: task.owner,
                  meta: task.priority,
                }))}
              />
            </div>

            <JsonPreview title="CRM JSON" value={crmRaw ?? crmSnapshot} />
          </Panel>

          <div className="grid gap-6">
            <Panel eyebrow="Validated POST" title="Contact Form API">
              <form className="space-y-3" onSubmit={handleContactSubmit}>
                <TextInput
                  label="Name"
                  value={contact.name}
                  onChange={(value) =>
                    setContact((current) => ({ ...current, name: value }))
                  }
                />
                <TextInput
                  label="Email"
                  type="email"
                  value={contact.email}
                  onChange={(value) =>
                    setContact((current) => ({ ...current, email: value }))
                  }
                />
                <TextArea
                  label="Message"
                  value={contact.message}
                  onChange={(value) =>
                    setContact((current) => ({ ...current, message: value }))
                  }
                  rows={4}
                />
                <Button type="submit" loading={contactLoading}>
                  POST /api/contact
                </Button>
              </form>
              {contactError ? <Alert tone="error">{contactError}</Alert> : null}
              <JsonPreview value={contactRaw} />
            </Panel>

            <Panel eyebrow="Webhook" title="Receiver">
              <form className="space-y-3" onSubmit={handleWebhookSubmit}>
                <TextArea
                  label="Sample Payload"
                  value={webhookBody}
                  onChange={setWebhookBody}
                  rows={9}
                  mono
                />
                <Button type="submit" loading={webhookLoading}>
                  POST /api/webhook
                </Button>
              </form>
              {webhookError ? <Alert tone="error">{webhookError}</Alert> : null}
              {webhookLast ? (
                <Alert tone="success">Last webhook stored in memory.</Alert>
              ) : (
                <EmptyState>No webhook has been received in this runtime.</EmptyState>
              )}
              <JsonPreview value={webhookRaw} />
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}

function Panel({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0b111c] p-5 shadow-2xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
        </div>
        {action}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block w-full">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block w-full">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm text-white outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-slate-950">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  mono?: boolean;
}) {
  return (
    <label className="block w-full">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full resize-y rounded-md border border-white/10 bg-black/25 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15 ${
          mono ? "font-mono leading-6" : "leading-6"
        }`}
      />
    </label>
  );
}

function Button({
  children,
  type,
  onClick,
  loading = false,
  variant = "primary",
}: {
  children: ReactNode;
  type: "submit" | "button";
  onClick?: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        variant === "primary"
          ? "border-cyan-300/40 bg-cyan-300 text-slate-950 hover:bg-cyan-200"
          : "border-white/10 bg-white/[0.04] text-slate-200 hover:border-cyan-300/40 hover:text-white"
      }`}
    >
      {loading ? "Working..." : children}
    </button>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-md text-sm font-semibold transition ${
        active
          ? "bg-cyan-300 text-slate-950"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Alert({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "success" | "warning" | "error";
}) {
  const classes = {
    success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
    warning: "border-amber-400/25 bg-amber-400/10 text-amber-100",
    error: "border-rose-400/25 bg-rose-400/10 text-rose-100",
  };

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${classes[tone]}`}>
      {children}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-sm text-slate-500">
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function RecordList({
  title,
  records,
  empty,
}: {
  title: string;
  records: Array<{
    id: string;
    title: string;
    detail: string;
    meta: string;
  }>;
  empty: string;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      <div className="space-y-2">
        {records.length ? (
          records.slice(0, 4).map((record) => (
            <div
              key={record.id}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {record.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {record.detail}
                  </p>
                </div>
                <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-slate-300">
                  {record.meta}
                </span>
              </div>
            </div>
          ))
        ) : (
          <EmptyState>{empty}</EmptyState>
        )}
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-14 animate-pulse rounded-lg border border-white/10 bg-white/[0.04]"
        />
      ))}
    </div>
  );
}

async function fetchApi<T>(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });
  const payload = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;

  if (!payload) {
    throw new ApiClientError(
      "The API returned an unreadable response.",
      response.status,
      null,
    );
  }

  if (!response.ok || !payload.ok) {
    throw new ApiClientError(
      payload.ok ? "The API request failed." : payload.error.message,
      response.status,
      payload,
    );
  }

  return {
    data: payload.data,
    payload,
  };
}

function captureApiError(
  error: unknown,
  setMessage: (value: string) => void,
  setPayload: (value: unknown) => void,
) {
  setMessage(readErrorMessage(error));
  setPayload(error instanceof ApiClientError ? error.payload : null);
}

function readErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
