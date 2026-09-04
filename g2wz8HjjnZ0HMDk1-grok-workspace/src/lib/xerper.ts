import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PROJECT = "base";
const XERPER_URL = "https://www.xerper.com/api/impressions";

export type XerperProfile = {
  name: string;
  screen_name: string;
  avatar: string;
  banner: string;
  bio: string;
  followers: number;
  following: number;
  verified: boolean;
  joined: string;
};

export type XerperPost = {
  id: string;
  screen_name: string;
  created_at: string;
  views: number;
  likes: number;
  reposts: number;
  replies: number;
  quotes: number;
  text: string;
  author_name: string;
  author_avatar: string;
  author_followers: number;
  author_verified: boolean;
  url: string;
};

export type XerperSeriesPoint = { t: string; v: number };

export type CheckResult = {
  ok: true;
  username: string;
  query: string;
  profile: XerperProfile;
  projectProfile: XerperProfile | null;
  postCount: number;
  totalImpressions: number;
  totalViews: number;
  series: XerperSeriesPoint[];
  posts: XerperPost[];
  partial: boolean;
};

export type CheckError = { ok: false; error: string };

const inputSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((s) => s.replace(/^@/, "").replace(/\s+/g, ""))
    .refine((s) => /^[A-Za-z0-9_]{1,15}$/.test(s), {
      message: "Enter a valid X username (letters, numbers, underscore).",
    }),
});

export const checkBaseViews = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<CheckResult | CheckError> => {
    const username = data.username;

    let response: Response;
    try {
      response = await fetch(XERPER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: "https://www.xerper.com",
          Referer: "https://www.xerper.com/",
        },
        body: JSON.stringify({ username, project: PROJECT }),
        signal: AbortSignal.timeout(50_000),
      });
    } catch {
      return {
        ok: false,
        error: "Could not reach view data. Try again in a moment.",
      };
    }

    let json: Record<string, unknown>;
    try {
      json = (await response.json()) as Record<string, unknown>;
    } catch {
      return { ok: false, error: "Unexpected response from view service." };
    }

    if (!response.ok || json.ok === false) {
      const err =
        typeof json.error === "string"
          ? json.error
          : "Could not load views for that username.";
      return { ok: false, error: err };
    }

    const posts = Array.isArray(json.posts)
      ? (json.posts as XerperPost[]).map((p) => ({
          ...p,
          views: Number(p.views) || 0,
          likes: Number(p.likes) || 0,
          reposts: Number(p.reposts) || 0,
          replies: Number(p.replies) || 0,
          quotes: Number(p.quotes) || 0,
        }))
      : [];

    const summedViews = posts.reduce((acc, p) => acc + p.views, 0);
    const totalImpressions = Number(json.total_impressions) || 0;
    const totalViews = summedViews > 0 ? summedViews : totalImpressions;

    const profile = (json.profile ?? {}) as XerperProfile;
    if (!profile.screen_name && !profile.name) {
      return { ok: false, error: "That X account was not found." };
    }

    return {
      ok: true,
      username: String(json.username ?? username),
      query: String(json.query ?? ""),
      profile,
      projectProfile: (json.project_profile as XerperProfile) ?? null,
      postCount: Number(json.post_count) || posts.length,
      totalImpressions,
      totalViews,
      series: Array.isArray(json.series)
        ? (json.series as XerperSeriesPoint[])
        : [],
      posts,
      partial: Boolean(json.partial),
    };
  });
