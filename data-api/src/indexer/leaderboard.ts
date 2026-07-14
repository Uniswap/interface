/**
 * Trading-leaderboard aggregation for the HookSwap Phase-2 indexer — PURE reads from the SQLite
 * event store, NO live RPC. Ranks trader wallets by native-denominated swap volume / trade count /
 * distinct tokens traded over a time window, from stored Swap events + pool_meta.
 *
 * ATTRIBUTION (the whole point of this module): the v2 Swap event's `sender` = the router and `to` =
 * the next-hop recipient (see schema.ts) — NEITHER is a reliable trader EOA. The ingest layer now
 * captures `origin` = `tx.from` (the real wallet that signed the swap). So the attribution wallet is
 *   COALESCE(NULLIF(origin,''), recipient)
 * — prefer the true EOA, and fall back to `recipient` only for rows indexed before origin capture
 * existed (never fabricated).
 *
 * EXCLUSIONS: swaps are grouped by wallet AFTER removing non-user addresses so intermediaries never
 * top the board — every known pool (multi-hop swaps route wallet→pool→pool→wallet, so a pool can be a
 * Swap.to) AND the chain's deployed routers (v2Router02 / swapRouter02 / universalRouter).
 *
 * DENOMINATION (honesty rule): volume is summed on the WRAPPED-NATIVE leg only (the one side we can
 * value) in native token units. `usdVolume` is `nativeVolume × usdPerNative` and is `null` whenever
 * the chain has no USD anchor pool ingested yet (getUsdPerNative undefined) — NEVER fabricated. Every
 * failure path returns [] (honest empty), never throws.
 */

import { BigNumber, ethers } from 'ethers'
import { getChain } from '../chains'
import { getUsdPerNative } from './metrics'
import { SqliteDatabase } from './schema'

/** Time windows a leaderboard can be scoped to. */
export type LeaderboardWindow = '24h' | '7d' | '30d' | 'all'
/** Metric the board is ranked (desc) by. */
export type LeaderboardMetric = 'volume' | 'trades' | 'tokens'

/** Allowed window values (for callers/validation). */
export const LEADERBOARD_WINDOWS: readonly LeaderboardWindow[] = ['24h', '7d', '30d', 'all']
/** Allowed metric values (for callers/validation). */
export const LEADERBOARD_METRICS: readonly LeaderboardMetric[] = ['volume', 'trades', 'tokens']

const SECONDS_PER_DAY = 86_400
const WINDOW_SECONDS: Record<LeaderboardWindow, number> = {
  '24h': SECONDS_PER_DAY,
  '7d': 7 * SECONDS_PER_DAY,
  '30d': 30 * SECONDS_PER_DAY,
  all: 0,
}

/** Default number of ranked wallets returned. */
const DEFAULT_LIMIT = 100

/**
 * Deployed HookSwap router addresses per chain (LOWERCASED) — excluded from trader attribution so a
 * router that ends up as a Swap participant never ranks. Sourced from
 * `contracts/deployments/<chain>.json` (v2Router02 / swapRouter02 / universalRouter). Structured as a
 * per-chain map so other chains can be added as they go live.
 *   - Robinhood (4663): robinhood.json (verified).
 */
const ROUTER_ADDRESSES_BY_CHAIN: Record<number, readonly string[]> = {
  4663: [
    '0xBe3729d06E3A17F3c7c5ac394c7bCbe138B6EEFA', // v2Router02
    '0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4', // swapRouter02
    '0x3D30133F4d4A80684F02d8310faF572E3dc193b3', // universalRouter
  ].map((a) => a.toLowerCase()),
}

/** One ranked wallet row. */
export interface LeaderboardRow {
  rank: number
  wallet: string
  /** wrapped-native leg volume, in native token units (decimal-adjusted). */
  nativeVolume: number
  /** nativeVolume × usdPerNative, or null when the chain has no USD anchor yet. */
  usdVolume: number | null
  /** number of swap events attributed to this wallet in the window. */
  trades: number
  /** distinct pools this wallet traded in the window. */
  tokensTraded: number
}

/** Options for {@link getLeaderboard}. */
export interface LeaderboardOptions {
  chainId: number
  window: LeaderboardWindow
  metric: LeaderboardMetric
  limit?: number
}

/** Raw joined swap row read from SQLite (amounts are decimal-string uint256 — summed in TS, not SQL). */
interface JoinedSwapRow {
  wallet: string
  pool: string
  amount0In: string
  amount1In: string
  amount0Out: string
  amount1Out: string
  token0: string
  token1: string
}

/** Per-wallet accumulator (raw wrapped-native wei + counts). */
interface WalletAgg {
  wallet: string
  nativeWei: BigNumber
  trades: number
  pools: Set<string>
}

/**
 * Rank trader wallets on one chain over `window` by `metric`. Native-denominated now; USD lights up
 * automatically once the chain's WETH/stablecoin anchor pool is seeded + ingested. Returns [] on any
 * failure or when the chain is unknown (never throws, never fabricates).
 */
export function getLeaderboard(db: SqliteDatabase, options: LeaderboardOptions): LeaderboardRow[] {
  try {
    const { chainId, window, metric } = options
    const limit = options.limit && options.limit > 0 ? options.limit : DEFAULT_LIMIT

    const chain = getChain(chainId)
    if (!chain) {
      return []
    }
    const wnative = chain.wrappedNative.address.toLowerCase()
    const nativeDecimals = chain.wrappedNative.decimals

    const nowSec = Math.floor(Date.now() / 1000)
    const windowSec = WINDOW_SECONDS[window]
    const since = windowSec > 0 ? nowSec - windowSec : 0

    // Exclusion set: every known pool on the chain (multi-hop intermediaries) ∪ deployed routers.
    const poolRows = db.prepare(`SELECT pool FROM pool_meta WHERE chainId=?`).all(chainId) as Array<{ pool: string }>
    const excluded = new Set<string>()
    for (const r of poolRows) {
      excluded.add(r.pool.toLowerCase())
    }
    for (const router of ROUTER_ADDRESSES_BY_CHAIN[chainId] ?? []) {
      excluded.add(router)
    }

    // The attribution wallet, lowercased, computed in SQL so it can also drive the NOT IN filter.
    const walletExpr = `COALESCE(NULLIF(LOWER(s.origin),''), LOWER(s.recipient))`
    const placeholders = excluded.size > 0 ? Array.from(excluded, () => '?').join(',') : "''"
    const rows = db
      .prepare(
        `SELECT ${walletExpr} AS wallet, s.pool AS pool,
                s.amount0In AS amount0In, s.amount1In AS amount1In,
                s.amount0Out AS amount0Out, s.amount1Out AS amount1Out,
                m.token0 AS token0, m.token1 AS token1
           FROM swap_events s
           JOIN pool_meta m ON m.chainId = s.chainId AND m.pool = s.pool
          WHERE s.chainId = ? AND s.timestamp >= ?
            AND ${walletExpr} NOT IN (${placeholders})
            AND ${walletExpr} <> ''`,
      )
      .all(chainId, since, ...Array.from(excluded)) as JoinedSwapRow[]

    // Aggregate per wallet in TS — amounts are uint256 decimal strings (BigNumber add, exact).
    const byWallet = new Map<string, WalletAgg>()
    for (const row of rows) {
      const wallet = row.wallet
      if (!wallet) {
        continue
      }
      let agg = byWallet.get(wallet)
      if (!agg) {
        agg = { wallet, nativeWei: BigNumber.from(0), trades: 0, pools: new Set() }
        byWallet.set(wallet, agg)
      }
      agg.trades += 1
      agg.pools.add(row.pool.toLowerCase())
      // Add the wrapped-native leg (in + out) when this pool has a native side; else 0 (still a trade).
      const t0IsNative = row.token0.toLowerCase() === wnative
      const t1IsNative = row.token1.toLowerCase() === wnative
      if (t0IsNative) {
        agg.nativeWei = agg.nativeWei.add(row.amount0In).add(row.amount0Out)
      } else if (t1IsNative) {
        agg.nativeWei = agg.nativeWei.add(row.amount1In).add(row.amount1Out)
      }
    }

    const usdPerNative = getUsdPerNative(db, chainId)

    const ranked = Array.from(byWallet.values()).map((agg) => {
      const nativeVolume = Number(ethers.utils.formatUnits(agg.nativeWei, nativeDecimals))
      return {
        wallet: agg.wallet,
        nativeVolume,
        usdVolume: usdPerNative === undefined ? null : nativeVolume * usdPerNative,
        trades: agg.trades,
        tokensTraded: agg.pools.size,
      }
    })

    ranked.sort((a, b) => {
      if (metric === 'trades') {
        return b.trades - a.trades
      }
      if (metric === 'tokens') {
        return b.tokensTraded - a.tokensTraded
      }
      return b.nativeVolume - a.nativeVolume
    })

    return ranked.slice(0, limit).map((r, i) => ({ rank: i + 1, ...r }))
  } catch {
    // Never fabricate a board — honest empty on any failure.
    return []
  }
}

/** Whether the chain currently has a live USD anchor (so `usdVolume` is populated, not null). */
export function isUsdAnchored(db: SqliteDatabase, chainId: number): boolean {
  try {
    return getUsdPerNative(db, chainId) !== undefined
  } catch {
    return false
  }
}
