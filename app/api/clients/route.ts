import { z } from "zod";
import { jsonOk, parseJsonBody } from "@/lib/api-response";
import { clients, type Client } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const clientCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  company: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  status: z.enum(["active", "prospect", "paused"]).default("prospect"),
  source: z.string().trim().min(2).max(80).default("Manual API"),
});

export async function GET() {
  return jsonOk({
    clients,
    total: clients.length,
  });
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, clientCreateSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const client: Client = {
    id: `client_${Date.now()}`,
    ...parsed.data,
    lastSeen: new Date().toISOString(),
  };

  clients.unshift(client);

  return jsonOk({ client }, { status: 201 });
}
