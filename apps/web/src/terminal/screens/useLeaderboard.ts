/**
 * HookSwap Terminal — trading-leaderboard data hook.
 *
 * Fetches the indexer-attributed trader ranking from the HookSwap data-api's plain REST route
 * `/v1/leaderboard` (NOT a Connect-RPC method — it's a browser-friendly GET/JSON facade). The base
 * URL is resolved exactly like the DataApiService transports (`getUniswapServiceUrls(config)
 * .dataApiBaseUrlV2`, i.e. `data.hookswap.org` when the override is set), so it follows the same
 * host the rest of the Terminal's data reads use.
 *
 * DATA POLICY (no mock data): the route returns real, indexer-derived rows or an empty array. USD is
 * `null` until the chain's WETH/stablecoin anchor pool exists (`usdAnchored=false`) — the screen shows
 * native volume and an honest note rather than a fabricated USD ranking.
 */
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { config } from 'uniswap/src/config'
import { getUniswapServiceUrls } from 'uniswap/src/constants/urls'

/** Launch scope is Robinhood (4663) only — the leaderboard is per-chain. */
export const LEADERBOARD_CHAIN_ID = 4663

export type LeaderboardWindow = '24h' | '7d' | '30d' | 'all'
export type LeaderboardMetric = 'volume' | 'trades' | 'tokens'

/** One ranked wallet, matching the data-api `LeaderboardRow` shape. */
export interface LeaderboardRow {
  rank: number
  wallet: string
  nativeVolume: number
  usdVolume: number | null
  trades: number
  tokensTraded: number
}

/** Full `/v1/leaderboard` response envelope. */
export interface LeaderboardResponse {
  chainId: number
  window: LeaderboardWindow
  metric: LeaderboardMetric
  /** true when USD figures are populated (a WETH/stablecoin anchor pool is ingested). */
  usdAnchored: boolean
  rows: LeaderboardRow[]
}

function leaderboardBaseUrl(): string {
  return getUniswapServiceUrls(config).dataApiBaseUrlV2
}

/**
 * React-Query hook for the trading leaderboard on the launch chain (Robinhood, 4663).
 * Re-fetches when `window` or `metric` change. Loading/error/empty are surfaced to the caller.
 */
export function useLeaderboard(
  window: LeaderboardWindow,
  metric: LeaderboardMetric,
): UseQueryResult<LeaderboardResponse> {
  return useQuery({
    queryKey: ['hookswap-leaderboard', LEADERBOARD_CHAIN_ID, window, metric],
    queryFn: async (): Promise<LeaderboardResponse> => {
      const url = `${leaderboardBaseUrl()}/v1/leaderboard?chainId=${LEADERBOARD_CHAIN_ID}&window=${window}&metric=${metric}`
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`leaderboard request failed: ${res.status}`)
      }
      const json = (await res.json()) as Partial<LeaderboardResponse>
      return {
        chainId: json.chainId ?? LEADERBOARD_CHAIN_ID,
        window: json.window ?? window,
        metric: json.metric ?? metric,
        usdAnchored: json.usdAnchored ?? false,
        rows: Array.isArray(json.rows) ? json.rows : [],
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
