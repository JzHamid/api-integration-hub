import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { ZodError } from "zod";

type ApiMeta = Record<string, unknown>;

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta: ApiMeta;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: ApiMeta;
};

export function jsonOk<T>(
  data: T,
  options: { status?: number; meta?: ApiMeta } = {},
) {
  return NextResponse.json<ApiSuccess<T>>(
    {
      ok: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...options.meta,
      },
    },
    { status: options.status ?? 200 },
  );
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
) {
  return NextResponse.json<ApiFailure>(
    {
      ok: false,
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status },
  );
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: jsonError("invalid_json", "Request body must be valid JSON.", 400),
    };
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError(
        "validation_error",
        "Request body failed validation.",
        422,
        formatZodIssues(parsed.error),
      ),
    };
  }

  return { ok: true, data: parsed.data };
}

export function formatZodIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.length ? issue.path.join(".") : "body",
    message: issue.message,
  }));
}

export function safeUpstreamMessage(service: string) {
  return `${service} is unavailable right now. Please try again shortly.`;
}
