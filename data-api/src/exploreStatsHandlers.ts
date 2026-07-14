/**
 * ExploreStatsService handlers for the HookSwap data-api — the Terminal's protocol-stats surface.
 *
 * WHY THIS EXISTS: the HookSwap interface's Landing hero metrics (total TVL / 24h volume) and the
 * Analytics screen read `uniswap.explore.v1.ExploreStatsService.ProtocolStats` (and `.ExploreStats`).
 * Uniswap's hosted ExploreStats service only indexes Uniswap's chains, so on a HookSwap custom chain
 * (Robinhood 4663) those calls return nothing. Repointing the interface's protocolStats/exploreStats
 * transports at this data-api (see packages/uniswap/src/data/rest/{protocolStats,exploreStats}.ts)
 * routes them here, where we aggregate REAL, on-chain-derived stats from the SAME sources listTopPools
 * uses.
 *
 * WHAT WE POPULATE (fully real, USD-anchored — never fabricated):
 *   - `ProtocolStats.dailyProtocolTvl.v2`            — summed USD TVL across the chain(s)' live v2 pools
 *   - `ProtocolStats.historicalProtocolVolume.{Month,Year,Max}.v2` — summed 24h USD volume across v2 pools
 *   - `ExploreStats.stats.{dailyProtocolTvl,historicalProtocolVolume}` — the same aggregates
 *
 * USD HONESTY (the hard rule): every USD figure derives from the ONE on-chain anchor rate
 * `getUsdPerNative(db, chainId)` (the chain's wrapped-native/stablecoin v2 pool — RH's WETH/USDG).
 * Until that anchor pool is seeded + ingested, `getUsdPerNative` (and therefore `getPoolTvlUsd` /
 * `getPoolVolumeUsd24h`) return `undefined`, so NO pool contributes and we emit EMPTY series (proto
 * default) — never a fabricated number. The frontend renders an empty series as an honest $0 / 0%.
 * The instant a WETH/USDG pool is ingested the aggregates light up automatically. There is no external
 * oracle. Only a SINGLE current data point is emitted per protocol version (we have current TVL + a
 * real 24h volume, but no USD-TVL history helper), so the % change the UI computes off a single point
 * is an honest 0% (its own new-launch convention), not a fabricated trend.
 *
 * WHAT WE LEAVE UNSET (never faked):
 *   - v3 / v4 series — the event indexer ingests only v2 Sync/Swap events, so v3 pools have no
 *     pool_meta → no USD metric is sourceable for them; v4 is excluded from HookSwap entirely.
 *   - ExplorerStats.{topTokens,poolStats,tokenStats,transactionStats,...} — those are served by
 *     DataApiService.listTokens / listTopPools; the flag-gated ExploreStats path only needs TVL/volume.
 *   - TokenRankings — auto-stubbed empty (honest "no rankings"), like createDataApiImpl's stubs.
 *
 * Error-safe: a missing indexer DB or any RPC/DB failure yields an empty-but-valid response — never a
 * thrown error and never a fabricated stat. Chains outside the supported set return empty-but-valid.
 */

import type { ServiceImpl } from '@connectrpc/connect'
import { ExploreStatsService } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_connect'
import {
  DailyProtocolTvl,
  ExploreStatsRequest,
  ExploreStatsResponse,
  ExplorerStats,
  HistoricalProtocolVolume,
  ProtocolStatsRequest,
  ProtocolStatsResponse,
  TimestampedAmount,
  VolumeSplit,
} from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { isSupportedChain, supportedChainIds } from './chains'
import { getV2PairsCached } from './handlers'
import { getDb } from './indexer/schema'
import { getPoolTvlUsd, getPoolVolumeUsd24h } from './indexer/metrics'

/**
 * The interface passes `chainId` as a string: either a specific chain id (e.g. "4663") or the
 * "all networks" sentinel. Mirrors `ALL_NETWORKS_ARG` in packages/uniswap/src/data/rest/base.ts.
 */
const ALL_NETWORKS = 'ALL_NETWORKS'

/** Resolve the request's string `chainId` → the supported numeric chain ids it targets (empty if none). */
function resolveRequestChainIds(chainIdStr: string): number[] {
  if (!chainIdStr || chainIdStr === ALL_NETWORKS) {
    return supportedChainIds()
  }
  const n = Number(chainIdStr)
  return Number.isFinite(n) && isSupportedChain(n) ? [n] : []
}

interface V2UsdAggregate {
  /** summed USD TVL across contributing v2 pools; undefined when NO pool could be USD-anchored. */
  tvlUsd?: number
  /** summed 24h USD volume across contributing v2 pools; undefined when NO pool could be USD-anchored. */
  volumeUsd24h?: number
}

/**
 * Sum USD TVL + 24h USD volume across every live v2 pool on one chain, from the indexer metrics. A
 * field stays `undefined` unless at least one pool yielded a real (anchor-defined, finite, ≥0) value —
 * so with no seeded WETH/USDG anchor the whole aggregate is undefined and nothing is fabricated. A real
 * zero (anchor exists, pools traded nothing) is a genuine 0, distinct from undefined. Never throws.
 */
async function aggregateV2UsdForChain(
  db: ReturnType<typeof getDb>,
  chainId: number,
): Promise<V2UsdAggregate> {
  let pairs
  try {
    pairs = await getV2PairsCached(chainId)
  } catch {
    // RPC down for this chain — contribute nothing (honest), don't fail the whole response.
    return {}
  }

  let tvlSum = 0
  let tvlCount = 0
  let volSum = 0
  let volCount = 0

  for (const p of pairs) {
    // ingest.ts stores pool addresses lowercased → key the metrics reads the same way.
    const poolKey = p.pairAddress.toLowerCase()
    try {
      const tvl = getPoolTvlUsd(db, chainId, poolKey)
      if (tvl !== undefined && Number.isFinite(tvl) && tvl >= 0) {
        tvlSum += tvl
        tvlCount++
      }
    } catch {
      // leave this pool out of the TVL sum
    }
    try {
      const vol = getPoolVolumeUsd24h(db, chainId, poolKey)
      if (vol !== undefined && Number.isFinite(vol) && vol >= 0) {
        volSum += vol
        volCount++
      }
    } catch {
      // leave this pool out of the volume sum
    }
  }

  return {
    tvlUsd: tvlCount > 0 ? tvlSum : undefined,
    volumeUsd24h: volCount > 0 ? volSum : undefined,
  }
}

/** Sum the per-chain v2 aggregates across all targeted chains. undefined fields stay undefined unless ≥1 chain contributed. */
async function aggregateV2Usd(chainIds: number[]): Promise<V2UsdAggregate> {
  // Indexer DB handle for USD-anchored metrics. If unavailable (better-sqlite3 not installed / no DB),
  // every USD figure is undefined → empty series → honest $0 in the UI. Never throw, never fabricate.
  let db: ReturnType<typeof getDb>
  try {
    db = getDb()
  } catch {
    return {}
  }

  const perChain = await Promise.all(chainIds.map((chainId) => aggregateV2UsdForChain(db, chainId)))

  let tvlSum = 0
  let tvlCount = 0
  let volSum = 0
  let volCount = 0
  for (const a of perChain) {
    if (a.tvlUsd !== undefined) {
      tvlSum += a.tvlUsd
      tvlCount++
    }
    if (a.volumeUsd24h !== undefined) {
      volSum += a.volumeUsd24h
      volCount++
    }
  }
  return {
    tvlUsd: tvlCount > 0 ? tvlSum : undefined,
    volumeUsd24h: volCount > 0 ? volSum : undefined,
  }
}

/** A single USD-denominated TimestampedAmount at `now`, or [] when the value is undefined (honest empty). */
function usdPointSeries(value: number | undefined, nowSec: number): TimestampedAmount[] {
  if (value === undefined) {
    return []
  }
  return [new TimestampedAmount({ currency: 'USD', timestamp: nowSec, value })]
}

/**
 * Build the shared DailyProtocolTvl + HistoricalProtocolVolume from a v2 USD aggregate.
 * v2 carries the (single, current) real point; v3/v4 stay empty (not USD-sourceable / excluded).
 * The volume aggregate is a 24h figure, placed as the latest point in every timeframe bucket
 * (Month/Year/Max) — each bucket's LATEST point is exactly "the current 24h volume", which is what the
 * interface's use24hProtocolVolume reads; we simply lack the older points for a real trend.
 */
function buildProtocolSeries(agg: V2UsdAggregate): {
  dailyProtocolTvl: DailyProtocolTvl
  historicalProtocolVolume: HistoricalProtocolVolume
} {
  const nowSec = Math.floor(Date.now() / 1000)
  const tvlSeries = usdPointSeries(agg.tvlUsd, nowSec)
  const volSeries = usdPointSeries(agg.volumeUsd24h, nowSec)

  const dailyProtocolTvl = new DailyProtocolTvl({ v2: tvlSeries, v3: [], v4: [] })
  const volumeSplit = (): VolumeSplit => new VolumeSplit({ v2: volSeries, v3: [], v4: [] })
  const historicalProtocolVolume = new HistoricalProtocolVolume({
    Month: volumeSplit(),
    Year: volumeSplit(),
    Max: volumeSplit(),
  })
  return { dailyProtocolTvl, historicalProtocolVolume }
}

async function handleProtocolStats(req: ProtocolStatsRequest): Promise<ProtocolStatsResponse> {
  const chainIds = resolveRequestChainIds(req.chainId)
  if (chainIds.length === 0) {
    return new ProtocolStatsResponse() // empty-but-valid for an unsupported/unknown chain
  }
  const agg = await aggregateV2Usd(chainIds)
  const { dailyProtocolTvl, historicalProtocolVolume } = buildProtocolSeries(agg)
  return new ProtocolStatsResponse({ dailyProtocolTvl, historicalProtocolVolume })
}

async function handleExploreStats(req: ExploreStatsRequest): Promise<ExploreStatsResponse> {
  const chainIds = resolveRequestChainIds(req.chainId)
  if (chainIds.length === 0) {
    return new ExploreStatsResponse() // empty-but-valid for an unsupported/unknown chain
  }
  const agg = await aggregateV2Usd(chainIds)
  const { dailyProtocolTvl, historicalProtocolVolume } = buildProtocolSeries(agg)
  // Only the protocol TVL/volume aggregates are populated here; topTokens/poolStats/tokenStats/etc are
  // served by DataApiService.listTokens/listTopPools (this ExploreStats path is flag-gated off by default).
  return new ExploreStatsResponse({
    stats: new ExplorerStats({ dailyProtocolTvl, historicalProtocolVolume }),
  })
}

/**
 * Build the full ServiceImpl: real ProtocolStats + ExploreStats, plus an honest empty-response stub for
 * every other ExploreStatsService method (TokenRankings) — same pattern as createDataApiImpl: the
 * interface treats an empty response as "no data" and renders honest empty states rather than crashing.
 */
export function createExploreStatsImpl(): ServiceImpl<typeof ExploreStatsService> {
  const impl: Record<string, (...args: unknown[]) => unknown> = {}

  for (const [methodName, methodInfo] of Object.entries(ExploreStatsService.methods)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    impl[methodName] = () => new (methodInfo as any).O()
  }

  // Real implementations override the stubs.
  impl.protocolStats = (req: unknown) => handleProtocolStats(req as ProtocolStatsRequest)
  impl.exploreStats = (req: unknown) => handleExploreStats(req as ExploreStatsRequest)

  return impl as unknown as ServiceImpl<typeof ExploreStatsService>
}
