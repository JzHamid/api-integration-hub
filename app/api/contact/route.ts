import { z } from "zod";
import { jsonOk, parseJsonBody } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  message: z.string().trim().min(10).max(2000),
});

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, contactSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  return jsonOk(
    {
      ticketId: `contact_${Date.now()}`,
      receivedAt: new Date().toISOString(),
      preview: {
        name: parsed.data.name,
        email: parsed.data.email,
        messageLength: parsed.data.message.length,
      },
    },
    { status: 202 },
  );
}
