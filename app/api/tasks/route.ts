import { z } from "zod";
import { jsonOk, parseJsonBody } from "@/lib/api-response";
import { tasks, type Task } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const taskCreateSchema = z.object({
  title: z.string().trim().min(3).max(140),
  owner: z.string().trim().min(2).max(80),
  status: z.enum(["open", "in-progress", "done"]).default("open"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "dueDate must use YYYY-MM-DD format.",
  }),
});

export async function GET() {
  return jsonOk({
    tasks,
    total: tasks.length,
  });
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, taskCreateSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const task: Task = {
    id: `task_${Date.now()}`,
    ...parsed.data,
  };

  tasks.unshift(task);

  return jsonOk({ task }, { status: 201 });
}
