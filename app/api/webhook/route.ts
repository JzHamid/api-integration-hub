import { z } from "zod";
import { jsonOk, parseJsonBody } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const webhookSchema = z
  .object({
    event: z.string().trim().min(3).max(80),
    source: z.string().trim().min(2).max(80),
    occurredAt: z.string().trim().datetime().optional(),
    data: z.record(z.string(), z.unknown()).default({}),
    signature: z.string().trim().max(240).optional(),
  })
  .strict();

type LastWebhook = z.infer<typeof webhookSchema> & {
  id: string;
  receivedAt: string;
};

let lastWebhook: LastWebhook | null = null;

export async function GET() {
  return jsonOk({
    lastWebhook,
  });
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, webhookSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  lastWebhook = {
    id: `wh_${Date.now()}`,
    receivedAt: new Date().toISOString(),
    ...parsed.data,
  };

  return jsonOk({ webhook: lastWebhook }, { status: 202 });
}
