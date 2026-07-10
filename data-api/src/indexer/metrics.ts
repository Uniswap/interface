/**
 * Metrics reads for the HookSwap Phase-2 indexer — PURE reads from the SQLite event store, NO live RPC.
 *
 * Everything derives from stored Swap/Sync events + pool_meta (real on-chain data captured by ingest).
 * All prices/volumes/TVL are NATIVE- or TOKEN-denominated. There is NO USD oracle on these chains, so
 * every USD-denominated value is returned as `undefined` (explicitly, never faked) — it lights up only
 * once a stablecoin anchor / price feed is added. Insufficient/empty data returns undefined or [] —
 * this layer never fabricates a number.
 *
 * Decimal adjustment uses ethers `formatUnits` (exact BigNumber→human), matching onchain.ts.
 */

import { BigNumber, ethers } from 'ethers'
import { getChain } from '../chains'
import { getPoolMeta, PoolMetaRow, SqliteDatabase } from './schema'

const SECONDS_PER_DAY = 86_400

/** A single stored Sync snapshot (reserves + when). */
interface SyncRow {
  blockNumber: number
  logIndex: number
  reserve0: string
  reserve1: string
  timestamp: number
}

/** Fetch the most-recent Sync snapshot for a pool (latest block, then latest log within it). */
function latestSync(db: SqliteDatabase, chainId: number, pool: string): SyncRow | undefined {
  return db
    .prepare(
      `SELECT blockNumber, logIndex, reserve0, reserve1, timestamp
         FROM sync_events WHERE chainId=? AND pool=?
         ORDER BY blockNumber DESC, logIndex DESC LIMIT 1`,
    )
    .get(chainId, pool) as SyncRow | undefined
}

/**
 * price of token0 expressed in token1, from reserves + decimals: (reserve1/10^dec1)/(reserve0/10^dec0).
 * Returns undefined if the token0 reserve is zero (price undefined, never Infinity/NaN).
 */
function price0In1(reserve0: string, reserve1: string, meta: PoolMetaRow): number | undefined {
  const r0 = Number(ethers.utils.formatUnits(reserve0, meta.decimals0))
  const r1 = Number(ethers.utils.formatUnits(reserve1, meta.decimals1))
  if (!(r0 > 0)) {
    return undefined
  }
  return r1 / r0
}

export interface SpotPriceNative {
  /** price of 1 unit of token0 expressed in token1 units (from the latest Sync reserves). */
  priceToken0InToken1: number
  /** price of 1 unit of token1 expressed in token0 units. */
  priceToken1InToken0: number
}

/**
 * Latest reserve-derived spot price for a pool, both directions. Native/token-denominated only.
 * undefined when there's no stored Sync yet, no pool_meta, or a zero reserve.
 */
export function getSpotPriceNative(db: SqliteDatabase, chainId: number, pool: string): SpotPriceNative | undefined {
  const meta = getPoolMeta(db, chainId, pool)
  if (!meta) {
    return undefined
  }
  const sync = latestSync(db, chainId, pool)
  if (!sync) {
    return undefined
  }
  const p0 = price0In1(sync.reserve0, sync.reserve1, meta)
  if (p0 === undefined || !(p0 > 0)) {
    return undefined
  }
  return { priceToken0InToken1: p0, priceToken1InToken0: 1 / p0 }
}

export interface Volume24h {
  /** total token0 that flowed through swaps (in + out), in token units, over the last 24h. */
  volumeToken0: number
  /** total token1 that flowed through swaps (in + out), in token units, over the last 24h. */
  volumeToken1: number
  /** number of Swap events in the window. */
  swapCount: number
  /** always undefined — no USD anchor exists on these chains. */
  volumeUSD: undefined
}

/**
 * 24h swap volume in TOKEN units + swap count. Sums (amountIn + amountOut) per side over now-24h.
 * undefined when pool_meta is missing (can't decimal-adjust). When there are no swaps, returns real
 * zeros (honest — the pool traded nothing), not undefined.
 */
export function get24hVolumeTokens(db: SqliteDatabase, chainId: number, pool: string): Volume24h | undefined {
  const meta = getPoolMeta(db, chainId, pool)
  if (!meta) {
    return undefined
  }
  const since = Math.floor(Date.now() / 1000) - SECONDS_PER_DAY
  const rows = db
    .prepare(
      `SELECT amount0In, amount1In, amount0Out, amount1Out
         FROM swap_events WHERE chainId=? AND pool=? AND timestamp >= ?`,
    )
    .all(chainId, pool, since) as Array<{
    amount0In: string
    amount1In: string
    amount0Out: string
    amount1Out: string
  }>

  let v0 = BigNumber.from(0)
  let v1 = BigNumber.from(0)
  for (const r of rows) {
    v0 = v0.add(r.amount0In).add(r.amount0Out)
    v1 = v1.add(r.amount1In).add(r.amount1Out)
  }
  return {
    volumeToken0: Number(ethers.utils.formatUnits(v0, meta.decimals0)),
    volumeToken1: Number(ethers.utils.formatUnits(v1, meta.decimals1)),
    swapCount: rows.length,
    volumeUSD: undefined,
  }
}

/**
 * 24h price change (native-denominated, token0-in-token1) as a FRACTION: (now - then)/then.
 * `now` = latest Sync price; `then` = the last Sync at/or-before the 24h-ago mark. undefined when
 * there's insufficient history (no baseline before the window, or no current price / meta).
 */
export function get24hPriceChangeNative(db: SqliteDatabase, chainId: number, pool: string): number | undefined {
  const meta = getPoolMeta(db, chainId, pool)
  if (!meta) {
    return undefined
  }
  const nowSync = latestSync(db, chainId, pool)
  if (!nowSync) {
    return undefined
  }
  const priceNow = price0In1(nowSync.reserve0, nowSync.reserve1, meta)
  if (priceNow === undefined) {
    return undefined
  }
  const cutoff = Math.floor(Date.now() / 1000) - SECONDS_PER_DAY
  const thenSync = db
    .prepare(
      `SELECT reserve0, reserve1 FROM sync_events
         WHERE chainId=? AND pool=? AND timestamp <= ?
         ORDER BY timestamp DESC, blockNumber DESC, logIndex DESC LIMIT 1`,
    )
    .get(chainId, pool, cutoff) as { reserve0: string; reserve1: string } | undefined
  if (!thenSync) {
    return undefined
  }
  const priceThen = price0In1(thenSync.reserve0, thenSync.reserve1, meta)
  if (priceThen === undefined || !(priceThen > 0)) {
    return undefined
  }
  return (priceNow - priceThen) / priceThen
}

export interface ReserveTVL {
  /** latest token0 reserve, in token units. */
  reserveToken0: number
  /** latest token1 reserve, in token units. */
  reserveToken1: number
  /** always undefined — no USD anchor. The wrapped-native side's amount is a real TVL proxy. */
  tvlUSD: undefined
}

/**
 * Latest pool reserves in token units (a real, native/token-denominated TVL proxy). undefined when
 * there's no stored Sync yet or no pool_meta.
 */
export function getReserveTVLTokens(db: SqliteDatabase, chainId: number, pool: string): ReserveTVL | undefined {
  const meta = getPoolMeta(db, chainId, pool)
  if (!meta) {
    return undefined
  }
  const sync = latestSync(db, chainId, pool)
  if (!sync) {
    return undefined
  }
  return {
    reserveToken0: Number(ethers.utils.formatUnits(sync.reserve0, meta.decimals0)),
    reserveToken1: Number(ethers.utils.formatUnits(sync.reserve1, meta.decimals1)),
    tvlUSD: undefined,
  }
}

export interface PricePoint {
  /** bucket start, unix seconds. */
  t: number
  /** native-denominated close price (token0 in token1) for the bucket. */
  price: number
}

/**
 * Native-denominated price history: the CLOSE (last Sync price) per `bucketSec` bucket since `sinceTs`.
 * Returns points sorted ascending by time. Empty array when there's no data / no meta (never fabricated).
 */
export function getPriceHistory(
  db: SqliteDatabase,
  chainId: number,
  pool: string,
  sinceTs: number,
  bucketSec: number,
): PricePoint[] {
  const meta = getPoolMeta(db, chainId, pool)
  if (!meta || !(bucketSec > 0)) {
    return []
  }
  const rows = db
    .prepare(
      `SELECT reserve0, reserve1, timestamp FROM sync_events
         WHERE chainId=? AND pool=? AND timestamp >= ?
         ORDER BY blockNumber ASC, logIndex ASC`,
    )
    .all(chainId, pool, sinceTs) as Array<{ reserve0: string; reserve1: string; timestamp: number }>

  // Ascending order → later rows overwrite the bucket, leaving the last (close) price per bucket.
  const byBucket = new Map<number, number>()
  for (const r of rows) {
    const p = price0In1(r.reserve0, r.reserve1, meta)
    if (p === undefined) {
      continue
    }
    const bucket = Math.floor(r.timestamp / bucketSec) * bucketSec
    byBucket.set(bucket, p)
  }
  return Array.from(byBucket.entries())
    .map(([t, price]) => ({ t, price }))
    .sort((a, b) => a.t - b.t)
}

/* ============================================================================================
 * USD-ANCHOR LAYER
 *
 * THE ANCHOR: every USD value on a chain derives from ONE real on-chain pool — the chain's
 * wrapped-native / stablecoin v2 pool. There is NO external price oracle. `getUsdPerNative` reads
 * that single pool's latest reserves to get stablecoin-per-native (e.g. USDG-per-WETH on Robinhood).
 * From that one number:
 *   priceUsd(token)   = priceInNative(token) × usdPerNative
 *   tvlUsd(pool)      = nativeSideReserve × usdPerNative × 2   (see TVL convention below)
 *   volumeUsd24h(pool)= nativeLegVolume    × usdPerNative
 *
 * Everything is undefined-honest: if the chain has no `stablecoin` configured, or its wrapped-native/
 * stablecoin pool has not been ingested yet (no pool_meta / no Sync), usdPerNative is `undefined` and
 * so is every downstream USD value. NOTHING is fabricated. This lights up automatically the moment a
 * WETH/USDG pool is seeded and the indexer ingests its first Sync.
 * ============================================================================================ */

/**
 * stablecoin-per-native for a chain (e.g. USDG per WETH on Robinhood), from the wrapped-native/
 * stablecoin v2 pool's latest Sync reserves, decimal-adjusted (honoring the stablecoin's real
 * decimals via the pool's stored decimals0/decimals1). Returns `undefined` when:
 *   - the chain has no `stablecoin` configured (RH-only for now; other chains stay undefined),
 *   - no ingested pool pairs {wrappedNative, stablecoin} (the anchor pool isn't seeded/indexed yet),
 *   - the anchor pool has no stored Sync, or either side's reserve is zero.
 * Never fabricated. The single number every other USD value multiplies by.
 */
export function getUsdPerNative(db: SqliteDatabase, chainId: number): number | undefined {
  const chain = getChain(chainId)
  if (!chain || !chain.stablecoin) {
    return undefined
  }
  const wnative = chain.wrappedNative.address.toLowerCase()
  const stable = chain.stablecoin.address.toLowerCase()
  if (wnative === stable) {
    // Degenerate: stablecoin IS the wrapped-native. No such chain here; guard against a bad config.
    return undefined
  }
  // Find the ingested v2 pool whose {token0,token1} == {wrappedNative, stablecoin} (either order).
  const row = db
    .prepare(
      `SELECT pool, token0, token1, decimals0, decimals1 FROM pool_meta
         WHERE chainId=?
           AND ( (LOWER(token0)=? AND LOWER(token1)=?) OR (LOWER(token0)=? AND LOWER(token1)=?) )
         LIMIT 1`,
    )
    .get(chainId, wnative, stable, stable, wnative) as
    | { pool: string; token0: string; token1: string; decimals0: number; decimals1: number }
    | undefined
  if (!row) {
    return undefined
  }
  const sync = latestSync(db, chainId, row.pool)
  if (!sync) {
    return undefined
  }
  const t0IsNative = row.token0.toLowerCase() === wnative
  const nativeRaw = t0IsNative ? sync.reserve0 : sync.reserve1
  const stableRaw = t0IsNative ? sync.reserve1 : sync.reserve0
  const nativeDec = t0IsNative ? row.decimals0 : row.decimals1
  const stableDec = t0IsNative ? row.decimals1 : row.decimals0
  const nativeHuman = Number(ethers.utils.formatUnits(nativeRaw, nativeDec))
  const stableHuman = Number(ethers.utils.formatUnits(stableRaw, stableDec))
  if (!(nativeHuman > 0) || !(stableHuman > 0)) {
    return undefined
  }
  return stableHuman / nativeHuman
}

/**
 * USD price of a token given its ALREADY-COMPUTED native-denominated price (from getSpotPriceNative /
 * onchain getSpotPrices): priceUsd = priceInNative × usdPerNative. undefined when usdPerNative is
 * undefined (no anchor) or priceInNative is not a finite non-negative number. Never fabricated.
 */
export function getTokenPriceUsd(db: SqliteDatabase, chainId: number, priceInNative: number): number | undefined {
  if (!(priceInNative >= 0) || !Number.isFinite(priceInNative)) {
    return undefined
  }
  const usdPerNative = getUsdPerNative(db, chainId)
  if (usdPerNative === undefined) {
    return undefined
  }
  return priceInNative * usdPerNative
}

/**
 * Full-pool TVL in USD for a v2 pool.
 *
 * TVL CONVENTION: we value the WRAPPED-NATIVE side of the pool in USD (nativeReserve × usdPerNative)
 * and multiply by 2. In a balanced constant-product (x·y=k) pool both sides hold equal value, so
 * 2× the native side ≈ total pool value. This anchors TVL to the ONE trusted USD reference
 * (usdPerNative) rather than pricing the paired token independently (which has no oracle). Requires
 * the pool to HAVE a wrapped-native side; a pool with neither side wrapped-native returns undefined
 * (can't be anchored). Also undefined when there's no anchor, no pool_meta, or no stored Sync.
 */
export function getPoolTvlUsd(db: SqliteDatabase, chainId: number, pool: string): number | undefined {
  const usdPerNative = getUsdPerNative(db, chainId)
  if (usdPerNative === undefined) {
    return undefined
  }
  const chain = getChain(chainId)
  if (!chain) {
    return undefined
  }
  const meta = getPoolMeta(db, chainId, pool)
  if (!meta) {
    return undefined
  }
  const wnative = chain.wrappedNative.address.toLowerCase()
  const t0IsNative = meta.token0.toLowerCase() === wnative
  const t1IsNative = meta.token1.toLowerCase() === wnative
  if (!t0IsNative && !t1IsNative) {
    return undefined
  }
  const sync = latestSync(db, chainId, pool)
  if (!sync) {
    return undefined
  }
  const nativeRaw = t0IsNative ? sync.reserve0 : sync.reserve1
  const nativeDec = t0IsNative ? meta.decimals0 : meta.decimals1
  const nativeHuman = Number(ethers.utils.formatUnits(nativeRaw, nativeDec))
  if (!(nativeHuman >= 0) || !Number.isFinite(nativeHuman)) {
    return undefined
  }
  return nativeHuman * usdPerNative * 2
}

/**
 * 24h swap volume in USD for a v2 pool: the wrapped-native leg's 24h token volume × usdPerNative.
 * We measure only the native-leg flow (which we can price via the anchor) — the paired token has no
 * independent oracle. Requires a wrapped-native side; returns undefined when there's no anchor, no
 * meta, no native side, or the underlying token-volume read is undefined. Real zero-volume returns 0.
 */
export function getPoolVolumeUsd24h(db: SqliteDatabase, chainId: number, pool: string): number | undefined {
  const usdPerNative = getUsdPerNative(db, chainId)
  if (usdPerNative === undefined) {
    return undefined
  }
  const chain = getChain(chainId)
  if (!chain) {
    return undefined
  }
  const meta = getPoolMeta(db, chainId, pool)
  if (!meta) {
    return undefined
  }
  const wnative = chain.wrappedNative.address.toLowerCase()
  const t0IsNative = meta.token0.toLowerCase() === wnative
  const t1IsNative = meta.token1.toLowerCase() === wnative
  if (!t0IsNative && !t1IsNative) {
    return undefined
  }
  const vol = get24hVolumeTokens(db, chainId, pool)
  if (!vol) {
    return undefined
  }
  const nativeVol = t0IsNative ? vol.volumeToken0 : vol.volumeToken1
  return nativeVol * usdPerNative
}
