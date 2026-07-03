export type ClientStatus = "active" | "prospect" | "paused";
export type TaskStatus = "open" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  status: ClientStatus;
  source: string;
  lastSeen: string;
};

export type Task = {
  id: string;
  title: string;
  owner: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
};

export const clients: Client[] = [
  {
    id: "client_1001",
    name: "Maya Patel",
    company: "Northstar Labs",
    email: "maya@northstarlabs.dev",
    status: "active",
    source: "GitHub demo",
    lastSeen: "2026-07-01T16:45:00.000Z",
  },
  {
    id: "client_1002",
    name: "Evan Brooks",
    company: "Atlas Freight",
    email: "evan@atlasfreight.example",
    status: "prospect",
    source: "Contact API",
    lastSeen: "2026-07-02T12:10:00.000Z",
  },
  {
    id: "client_1003",
    name: "Nora Chen",
    company: "Beacon Studio",
    email: "nora@beaconstudio.example",
    status: "paused",
    source: "Webhook import",
    lastSeen: "2026-06-29T19:30:00.000Z",
  },
];

export const tasks: Task[] = [
  {
    id: "task_2001",
    title: "Review GitHub integration response shape",
    owner: "Jazhem",
    status: "done",
    priority: "medium",
    dueDate: "2026-07-03",
  },
  {
    id: "task_2002",
    title: "Add CRM POST body validation",
    owner: "Jazhem",
    status: "in-progress",
    priority: "high",
    dueDate: "2026-07-05",
  },
  {
    id: "task_2003",
    title: "Wire webhook payload preview",
    owner: "Jazhem",
    status: "open",
    priority: "low",
    dueDate: "2026-07-08",
  },
];

export const requestLogs = [
  {
    id: "req_001",
    method: "GET",
    path: "/api/github/octocat",
    status: 200,
    latency: "312ms",
    time: "2 min ago",
  },
  {
    id: "req_002",
    method: "POST",
    path: "/api/clients",
    status: 201,
    latency: "41ms",
    time: "8 min ago",
  },
  {
    id: "req_003",
    method: "GET",
    path: "/api/weather?city=Boston",
    status: 200,
    latency: "228ms",
    time: "16 min ago",
  },
  {
    id: "req_004",
    method: "POST",
    path: "/api/webhook",
    status: 422,
    latency: "24ms",
    time: "31 min ago",
  },
];

export const integrationSummaries = [
  {
    name: "GitHub Lookup",
    route: "/api/github/[username]",
    status: "Live",
    description: "Server-side REST lookup with repo highlights and rate-limit handling.",
  },
  {
    name: "Weather Lookup",
    route: "/api/weather",
    status: "Live",
    description: "Open-Meteo forecast proxy with city geocoding or coordinates.",
  },
  {
    name: "Internal CRM",
    route: "/api/clients + /api/tasks",
    status: "Mocked",
    description: "In-memory CRM records with Zod-validated create endpoints.",
  },
  {
    name: "Webhook Receiver",
    route: "/api/webhook",
    status: "Ready",
    description: "Safe payload validation and last-event preview for demos.",
  },
];
