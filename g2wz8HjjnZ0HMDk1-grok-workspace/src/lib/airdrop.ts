/** Hypothetical $BASE token model — unofficial. */
export const TOTAL_SUPPLY = 10_000_000_000;
export const CREATOR_SHARE = 0.005;
export const CREATOR_POOL = TOTAL_SUPPLY * CREATOR_SHARE; // 50,000,000

/**
 * Pro-rata of the creator pool by views.
 * Denominator is a published model of total qualifying Base views
 * across all creators (we cannot observe the full set in this checker).
 */
export const ASSUMED_NETWORK_VIEWS = 250_000_000;
export const BASE_PER_VIEW = CREATOR_POOL / ASSUMED_NETWORK_VIEWS; // 0.2
export const MAX_WALLET_SHARE = 0.01;
export const MAX_WALLET_TOKENS = CREATOR_POOL * MAX_WALLET_SHARE; // 500,000

export type TokenEstimate = {
  tokens: number;
  raw: number;
  shareOfPool: number;
  rate: number;
  capped: boolean;
};

export function estimateBaseTokens(views: number): TokenEstimate {
  if (views <= 0) {
    return {
      tokens: 0,
      raw: 0,
      shareOfPool: 0,
      rate: BASE_PER_VIEW,
      capped: false,
    };
  }
  const raw = views * BASE_PER_VIEW;
  const tokens = Math.min(raw, MAX_WALLET_TOKENS);
  return {
    tokens,
    raw,
    shareOfPool: tokens / CREATOR_POOL,
    rate: BASE_PER_VIEW,
    capped: raw > MAX_WALLET_TOKENS,
  };
}
