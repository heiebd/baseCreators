import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat("en", {
    notation: n >= 10000 ? "compact" : "standard",
    maximumFractionDigits: n >= 1000000 ? 2 : n >= 10000 ? 1 : 0,
  }).format(n);
}

export function formatInt(n: number) {
  return new Intl.NumberFormat("en").format(n);
}

export function formatToken(n: number) {
  if (n === 0) return "0";
  if (n < 1) {
    return new Intl.NumberFormat("en", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(n);
  }
  if (n < 100) {
    return new Intl.NumberFormat("en", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n);
  }
  return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(n);
}

export function formatPct(n: number) {
  const pct = n * 100;
  if (pct === 0) return "0%";
  if (pct < 0.001) return "<0.001%";
  if (pct < 0.01) return `${pct.toFixed(3)}%`;
  if (pct < 1) return `${pct.toFixed(2)}%`;
  return `${pct.toFixed(2)}%`;
}
