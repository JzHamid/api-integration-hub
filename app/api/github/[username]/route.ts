import { z } from "zod";
import {
  jsonError,
  jsonOk,
  safeUpstreamMessage,
} from "@/lib/api-response";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    username: string;
  }>;
};

const usernameSchema = z
  .string()
  .trim()
  .min(1)
  .max(39)
  .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/, {
    message: "GitHub usernames may contain letters, numbers, and hyphens.",
  });

const githubUserSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  avatar_url: z.string().url(),
  html_url: z.string().url(),
  bio: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  blog: z.string().nullable(),
  public_repos: z.number(),
  followers: z.number(),
  following: z.number(),
  created_at: z.string(),
});

const githubRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  html_url: z.string().url(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  updated_at: z.string(),
});

const githubRepoListSchema = z.array(githubRepoSchema);

export async function GET(_request: Request, context: RouteContext) {
  const { username: rawUsername } = await context.params;
  const username = usernameSchema.safeParse(rawUsername);

  if (!username.success) {
    return jsonError(
      "invalid_username",
      "Enter a valid GitHub username.",
      422,
      username.error.issues.map((issue) => issue.message),
    );
  }

  try {
    const profileResponse = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username.data)}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "api-integration-hub-demo",
        },
        cache: "no-store",
      },
    );

    if (profileResponse.status === 404) {
      return jsonError(
        "github_not_found",
        "No GitHub profile was found for that username.",
        404,
      );
    }

    if (isGitHubRateLimited(profileResponse)) {
      return jsonError(
        "github_rate_limited",
        "GitHub rate limit reached. Please wait a few minutes and try again.",
        429,
      );
    }

    if (!profileResponse.ok) {
      return jsonError(
        "github_unavailable",
        safeUpstreamMessage("GitHub"),
        502,
      );
    }

    const profile = githubUserSchema.parse(await profileResponse.json());
    const reposResponse = await fetch(
      `https://api.github.com/users/${encodeURIComponent(
        username.data,
      )}/repos?sort=updated&per_page=6`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "api-integration-hub-demo",
        },
        cache: "no-store",
      },
    );

    let repositories: z.infer<typeof githubRepoSchema>[] = [];
    let repoWarning: string | null = null;

    if (reposResponse.ok) {
      repositories = githubRepoListSchema.parse(await reposResponse.json());
    } else if (isGitHubRateLimited(reposResponse)) {
      repoWarning = "Repository highlights are temporarily rate limited.";
    } else {
      repoWarning = "Repository highlights could not be loaded.";
    }

    return jsonOk({
      profile,
      repositories,
      repoWarning,
    });
  } catch {
    return jsonError("github_unavailable", safeUpstreamMessage("GitHub"), 502);
  }
}

function isGitHubRateLimited(response: Response) {
  return (
    response.status === 403 &&
    response.headers.get("x-ratelimit-remaining") === "0"
  );
}
