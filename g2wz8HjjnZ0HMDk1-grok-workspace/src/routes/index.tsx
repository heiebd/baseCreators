import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, Loader2, Search, ShieldAlert } from "lucide-react";
import { checkBaseViews, type CheckResult } from "@/lib/xerper";
import {
  ASSUMED_NETWORK_VIEWS,
  BASE_PER_VIEW,
  CREATOR_POOL,
  CREATOR_SHARE,
  estimateBaseTokens,
  MAX_WALLET_TOKENS,
  TOTAL_SUPPLY,
} from "@/lib/airdrop";
import { cn, formatCompact, formatInt, formatPct, formatToken } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const username = handle.trim();
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const data = await checkBaseViews({ data: { username } });
      if (!data.ok) {
        setResult(null);
        setError(data.error);
        return;
      }
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Check failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-bg text-fg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklab, var(--color-primary) 14%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--color-primary) 14%, transparent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% -10%, black 30%, transparent 75%)",
        }}
      />
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-sm bg-primary text-sm font-semibold text-primary-fg">
            B
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">Base Views</p>
            <p className="text-xs text-muted">Creator airdrop checker</p>
          </div>
        </div>
        <p className="hidden text-xs text-subtle sm:block">Unofficial · Base only</p>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-20">
        <section className="mt-6 max-w-2xl sm:mt-12">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-primary">
            Base · X creators
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            How much $BASE are you estimated to get?
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            Enter your X username. We estimate your $BASE creator allocation from a 0.5% supply pool.
          </p>
        </section>

        <form
          onSubmit={onSubmit}
          className="mt-8 flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:p-2"
        >
          <label className="sr-only" htmlFor="username">
            X username
          </label>
          <div className="flex min-h-11 flex-1 items-center gap-2 px-3">
            <Search className="size-4 shrink-0 text-subtle" />
            <span className="text-muted">@</span>
            <input
              id="username"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="username"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="h-11 w-full bg-transparent text-base text-fg outline-none placeholder:text-subtle"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !handle.trim()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-fg transition-opacity disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Reading views
              </>
            ) : (
              <>
                Estimate $BASE
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>
        <p className="mt-3 text-xs text-subtle">
          Looks up posts matching @base, #base, or Base. Retweets excluded.
        </p>

        {error ? (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-danger/30 bg-elevated px-4 py-3 text-sm text-danger"
          >
            {error}
          </div>
        ) : null}

        {result ? <ResultCard result={result} /> : <HowItWorks />}
      </main>
    </div>
  );
}

function ResultCard({ result }: { result: CheckResult }) {
  const views = result.totalViews;
  const est = estimateBaseTokens(views);
  const chartData = result.series.map((p) => ({
    t: p.t.slice(5),
    v: p.v,
  }));

  return (
    <section className="mt-10 space-y-6">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-start sm:p-7">
          <ProfileBlock result={result} />
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Total views" value={formatCompact(views)} hint={formatInt(views)} />
            <Stat label="Base posts" value={formatInt(result.postCount)} />
            <Stat
              label="Share of pool"
              value={formatPct(est.shareOfPool)}
              hint={`of ${formatCompact(CREATOR_POOL)} $BASE`}
            />
          </div>
        </div>

        <div className="border-t border-border px-5 py-6 sm:px-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Estimated $BASE
              </p>
              <p className="mt-1 font-mono text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                {formatToken(est.tokens)}
              </p>
              <p className="mt-2 text-sm text-muted">
                {formatToken(BASE_PER_VIEW)} $BASE per view
                {est.capped
                  ? ` · capped at ${formatInt(MAX_WALLET_TOKENS)} (1% of creator pool)`
                  : null}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 font-mono text-xs",
                views > 0
                  ? "bg-primary text-primary-fg"
                  : "bg-elevated text-muted",
              )}
            >
              {views > 0 ? "Eligible" : "Ineligible"}
            </span>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs text-muted">
              <span>Your slice of the 50M creator pool</span>
              <span>{formatPct(est.shareOfPool)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.min(100, Math.max(views > 0 ? 1.5 : 0, est.shareOfPool * 100 * 20))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <PoolMath views={views} tokens={est.tokens} />

      {chartData.length > 1 ? (
        <div className="rounded-xl border border-border bg-surface p-5 sm:p-7">
          <p className="text-sm font-medium">Cumulative impressions</p>
          <p className="mt-1 text-xs text-muted">From the same Base-matching posts.</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="t"
                  tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => formatCompact(v)}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    color: "var(--color-fg)",
                    fontSize: 12,
                  }}
                  formatter={(value) => [formatInt(Number(value ?? 0)), "impressions"]}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--color-primary)"
                  fill="url(#fillViews)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-7">
          <p className="text-sm font-medium">Posts counted</p>
          <p className="font-mono text-xs text-muted">{result.posts.length} shown</p>
        </div>
        {result.posts.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted sm:px-7">
            No Base-matching original posts found for this account.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {result.posts.map((p) => {
              const postTokens = estimateBaseTokens(p.views).tokens;
              return (
                <li key={p.id}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block px-5 py-4 transition-colors hover:bg-elevated sm:px-7"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="line-clamp-3 text-sm leading-relaxed text-fg/90">
                        {p.text}
                      </p>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-sm tabular-nums text-primary">
                          {formatToken(postTokens)}{" "}
                          <span className="text-xs text-muted">$BASE</span>
                        </p>
                        <p className="font-mono text-xs tabular-nums text-subtle">
                          {formatCompact(p.views)} views
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-subtle">
                      {p.created_at.replace(/\+0000 /, " ")} · {formatInt(p.likes)} likes
                    </p>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
        {result.partial ? (
          <p className="border-t border-border px-5 py-3 text-xs text-warn sm:px-7">
            Partial scan — some older posts may be missing.
          </p>
        ) : null}
      </div>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-subtle">
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
        Unofficial checker. Not affiliated with Base or Coinbase. $BASE supply,
        creator %, and network views are a model, not a confirmed drop.
      </p>
    </section>
  );
}

function PoolMath({ views, tokens }: { views: number; tokens: number }) {
  const rows = [
    { k: "Total supply", v: `${formatInt(TOTAL_SUPPLY)} $BASE` },
    {
      k: "Creator allocation",
      v: `${CREATOR_SHARE * 100}% → ${formatInt(CREATOR_POOL)} $BASE`,
    },
    { k: "Assumed network views", v: formatInt(ASSUMED_NETWORK_VIEWS) },
    { k: "Rate", v: `${formatToken(BASE_PER_VIEW)} $BASE / view` },
    { k: "Your views", v: formatInt(views) },
    { k: "Your $BASE", v: formatToken(tokens) },
  ];
  return (
    <div className="rounded-xl border border-border bg-surface">
      <p className="border-b border-border px-5 py-3 text-sm font-medium sm:px-7">
        Allocation model
      </p>
      <ul>
        {rows.map((r) => (
          <li
            key={r.k}
            className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 last:border-b-0 sm:px-7"
          >
            <span className="text-sm text-muted">{r.k}</span>
            <span className="font-mono text-sm tabular-nums">{r.v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProfileBlock({ result }: { result: CheckResult }) {
  const p = result.profile;
  return (
    <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
      {p.avatar ? (
        <img
          src={p.avatar}
          alt=""
          className="size-14 rounded-lg object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex size-14 items-center justify-center rounded-lg bg-elevated font-semibold">
          {(p.screen_name || "?").slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold">{p.name || p.screen_name}</p>
        <p className="truncate text-sm text-muted">@{p.screen_name}</p>
        <p className="text-xs text-subtle">
          {formatCompact(p.followers || 0)} followers
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

function HowItWorks() {
  const rows = [
    { k: "Total supply", v: `${formatInt(TOTAL_SUPPLY)} $BASE` },
    { k: "Creators (0.5%)", v: `${formatInt(CREATOR_POOL)} $BASE` },
    { k: "Network views (model)", v: formatInt(ASSUMED_NETWORK_VIEWS) },
    { k: "Rate", v: `${formatToken(BASE_PER_VIEW)} $BASE / view` },
    { k: "Wallet cap", v: `${formatInt(MAX_WALLET_TOKENS)} $BASE` },
  ];
  return (
    <section className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <h2 className="text-lg font-semibold">How the estimate works</h2>
        <ol className="mt-5 space-y-4">
          {[
            "You enter an X username. Project is locked to Base.",
            "We pull matching original posts and sum their public view counts.",
            `Creators get 0.5% of 10B supply (${formatInt(CREATOR_POOL)} $BASE), split pro-rata by views.`,
          ].map((text, i) => (
            <li key={text} className="flex gap-3 text-sm leading-relaxed text-muted">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-elevated font-mono text-xs text-fg">
                {i + 1}
              </span>
              {text}
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-xl border border-border bg-surface">
        <p className="border-b border-border px-4 py-3 text-sm font-medium">
          $BASE pool
        </p>
        <ul>
          {rows.map((r) => (
            <li
              key={r.k}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="text-muted">{r.k}</span>
              <span className="font-mono tabular-nums">{r.v}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
