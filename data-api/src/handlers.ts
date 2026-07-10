/**
 * DataApiService method handlers for the HookSwap data-api.
 *
 * REAL (live on-chain reads + event indexer):
 *   - listTokens   → each requested chain's native + wrapped-native + seeded ERC-20s, plus tokens
 *                    discovered in its live v2/v3 pools (metadata read live on-chain). Each token also
 *                    carries real NATIVE-denominated stats (priceChange1d, priceHistory1d) fed by the
 *                    event indexer when it's enabled (see buildTokenStats).
 *   - listTopPools → each requested chain's live v2 pools (CREATE2-discovered, real reserves) and v3
 *                    pools (PoolCreated-log-discovered, real balances), with USD-anchored PoolStats
 *                    from the indexer once a stablecoin anchor pool exists (see buildPoolStats).
 *
 * The event indexer EXISTS and is deployed (gated on INDEXER_ENABLED): it tails Swap/Sync events into
 * SQLite and feeds the TokenStats/PoolStats above. What it powers NOW is native metrics; USD-denominated
 * fields stay unset until a stablecoin (USDG) anchor pool exists on the chain.
 *
 * STUBS (valid empty proto responses, NOT errors — so the interface degrades gracefully):
 *   - everything else (portfolio, wallet balances, transactions, positions, charts, rewards,
 *     protocol stats, token prices, RWAs, token-factory, reports, ...). These need higher-level
 *     time-series / protocol-stats endpoints (NOT the event indexer, which is live) and/or a USD price
 *     oracle. Returning an empty-but-valid Message keeps the frontend from crashing (it renders honest
 *     empty/"—" states).
 *
 * NO FABRICATED DATA: value/USD/volume fields we can't source truthfully are left unset (proto
 * default / undefined), never invented. See the pricing note in onchain.ts.
 */

import type { ServiceImpl } from '@connectrpc/connect'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import {
  ListTokensRequest,
  ListTokensResponse,
  ListTopPoolsRequest,
  ListTopPoolsResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  ChainToken,
  MultichainToken,
  Pool,
  PoolStats,
  TimestampedValue,
  Token,
  TokenStats,
  TokenType,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { getChain, isSupportedChain, supportedChainIds } from './chains'
import { getV2Pairs, getV3Pools, TokenMeta, V2PairData, V3PoolData } from './onchain'
import {
  get24hPriceChangeNative,
  getPoolTvlUsd,
  getPoolVolumeUsd24h,
  getPriceHistory,
  getSpotPriceNative,
  getTokenPriceUsd,
  getUsdPerNative,
} from './indexer/metrics'
import { getDb, SqliteDatabase } from './indexer/schema'

/** Uniswap v2 fixed swap fee = 0.30%, expressed in pips (hundredths of a bip) as the proto expects. */
const V2_FEE_TIER_PIPS = 3000

/**
 * Native price-history window for `TokenStats.priceHistory1d`: the trailing 24h, sampled as the CLOSE
 * price per hourly bucket (→ up to 24 points). This is a NATIVE-denominated series (subject token priced
 * in the chain's wrapped-native) — every UI consumer renders it as a bare, axis-less sparkline shape or a
 * clearly native-labeled value, NEVER under a `$`/USD label (see TerminalChartPanel + LandingScreen).
 */
const PRICE_HISTORY_WINDOW_SEC = 86_400
const PRICE_HISTORY_BUCKET_SEC = 3_600

/**
 * Tiny TTL cache so repeated Markets/token-picker requests don't hammer the public RPC.
 * Current-state only; a short TTL keeps reserves reasonably fresh without a DB.
 */
const POOLS_TTL_MS = 15_000
const poolsCache = new Map<number, { at: number; data: V2PairData[] }>()
const v3PoolsCache = new Map<number, { at: number; data: V3PoolData[] }>()

async function getV2PairsCached(chainId: number): Promise<V2PairData[]> {
  const hit = poolsCache.get(chainId)
  const now = Date.now()
  if (hit && now - hit.at < POOLS_TTL_MS) {
    return hit.data
  }
  const data = await getV2Pairs(chainId)
  poolsCache.set(chainId, { at: now, data })
  return data
}

async function getV3PoolsCached(chainId: number): Promise<V3PoolData[]> {
  const hit = v3PoolsCache.get(chainId)
  const now = Date.now()
  if (hit && now - hit.at < POOLS_TTL_MS) {
    return hit.data
  }
  const data = await getV3Pools(chainId)
  v3PoolsCache.set(chainId, { at: now, data })
  return data
}

/** Resolve which supported chains a request targets: its chainIds, or all supported if none given. */
function resolveChainIds(requested: number[]): number[] {
  const ids = requested.length ? requested : supportedChainIds()
  return ids.filter(isSupportedChain)
}

/** data.v1.Token for a wrapped-native or seeded ERC-20 (real metadata; ERC-20 type). */
function toProtoErc20Token(meta: TokenMeta): Token {
  return new Token({
    chainId: meta.chainId,
    address: meta.address,
    symbol: meta.symbol,
    name: meta.name,
    decimals: meta.decimals,
    type: TokenType.ERC20,
    // metadata/stats intentionally omitted HERE: no logo registry, and USD price/volume need a
    // stablecoin (USDG) anchor pool that doesn't exist on these chains yet. Native stats
    // (priceChange1d/priceHistory1d) are attached separately by buildTokenStats when the event indexer
    // is live. Leaving unset fields empty renders honest "—" in the UI (no fabricated values).
  })
}

// ---------- Event-indexer stats: native-sourceable token metrics from the SQLite indexer ----------

/**
 * Build the `TokenStats` sub-message for one token from the event indexer.
 *
 * WHAT WE POPULATE NOW (fully real, unit-safe):
 *   - `priceChange1d` — a UNITLESS PERCENT. Sourced from `get24hPriceChangeNative`, which returns a
 *     FRACTION of the pool's token0-in-token1 price over 24h. Two conversions are applied so the value
 *     is honest for THIS token:
 *       1. Orientation: the metric is the change of price(token0-in-token1). If our token is the pool's
 *          token1, that is the change of the INVERSE (native-in-token) price, so we convert it to the
 *          token's own native-denominated change via  change(1/p) = -f/(1+f)  (exact; 1+f = pNow/pThen > 0
 *          always, since both reserve-derived prices are > 0). If our token is token0, f is already its
 *          native-denominated change.
 *       2. Scale: the proto `priceChange1d` (and the Terminal's `formatSignedPct`, MarketsScreen.tsx:116-118)
 *          treat the value as a PERCENT number (e.g. 5.2 → "+5.2%"), matching Uniswap's legacy mapper
 *          (`priceChange1d: stat.pricePercentChange1Day?.value`). `get24hPriceChangeNative` returns a
 *          fraction (0.052), so we multiply by 100.
 *
 *   - `priceHistory1d` — the trailing-24h NATIVE close series (subject token priced in the chain's
 *     wrapped-native), sampled hourly via `getPriceHistory` and ORIENTED to this token: if the token is the
 *     pool's token0 the stored price0In1 is already token-in-wrapped-native; if it's token1 we invert (1/p).
 *     This is the SAME native series Markets/Analytics/CommandPalette already render as a bare, axis-less
 *     sparkline shape. It is populated (per Reggie's 2026-07-10 decision to SHOW native price data
 *     pre-liquidity) BECAUSE the two consumers that showed its last value under a `$` were fixed to label it
 *     natively / hide the `$` (TerminalChartPanel header + native-line caption; LandingScreen hero tag).
 *     Empty/omitted on any DB read failure or insufficient history — never fabricated.
 *
 * WHAT WE DELIBERATELY LEAVE UNSET (never faked, per the no-mock / no-mislabel rule):
 *   - `price`, `fdv`, `volume1h/1d/7d/30d/1y` — USD-DENOMINATED in the UI (rendered via
 *     `convertFiatAmountFormatted(NumberType.Fiat*)`). No USD/stablecoin anchor exists on these chains yet,
 *     so populating them with native ratios would put a native number behind a `$` axis. Left undefined.
 *   - `priceChange1h` — the indexer exposes ONLY a 24h price-change window (`get24hPriceChangeNative`).
 *     Reusing the 24h value for the 1h field would MISLABEL the timeframe (a 24h magnitude shown/sorted as
 *     1h), so it stays unset until a real 1h-windowed metric exists. This intentionally deviates from the
 *     original task note (which suggested reusing the 24h value) in favor of the stricter no-mislabel rule.
 *
 * Returns undefined (→ `stats` omitted, honest "—" in the UI) when: the token is native / wrapped-native /
 * has no wrapped-native pool, the indexer hasn't ingested a 24h baseline yet, or any DB read fails.
 */
function buildTokenStats(
  db: SqliteDatabase,
  tok: Token,
  pairs: V2PairData[] | undefined,
): TokenStats | undefined {
  // Native has no contract; the wrapped-native has no wrapped-native/wrapped-native pool → no self price.
  if (tok.type === TokenType.NATIVE || !tok.address) {
    return undefined
  }
  const chain = getChain(tok.chainId)
  if (!chain) {
    return undefined
  }
  const wnative = chain.wrappedNative.address.toLowerCase()
  const addr = tok.address.toLowerCase()
  if (addr === wnative) {
    return undefined
  }
  // Representative pool for a token's native-denominated price = its pair vs the chain's wrapped-native.
  const pair = (pairs ?? []).find((p) => {
    const a0 = p.token0.address.toLowerCase()
    const a1 = p.token1.address.toLowerCase()
    return (a0 === addr && a1 === wnative) || (a1 === addr && a0 === wnative)
  })
  if (!pair) {
    return undefined
  }
  // ingest.ts stores pool addresses lowercased → key the metrics read the same way.
  const poolKey = pair.pairAddress.toLowerCase()
  let f: number | undefined
  try {
    f = get24hPriceChangeNative(db, tok.chainId, poolKey)
  } catch {
    // DB/query failure — return the token without stats, never fabricate a change.
    return undefined
  }
  if (f === undefined) {
    return undefined
  }
  const tokenIsToken0 = pair.token0.address.toLowerCase() === addr
  const tokenChangeFraction = tokenIsToken0 ? f : -f / (1 + f)

  const stats = new TokenStats({ priceChange1d: tokenChangeFraction * 100 })

  // Native-denominated 1D price history (hourly close), oriented to THIS token's price in the pool's
  // wrapped-native quote: token0 → stored price0In1 as-is; token1 → inverse (1/p). Shape-real for the
  // sparkline consumers; labeled natively (never `$`) by the header/caption consumers. Error-safe: any
  // DB failure or empty/insufficient history leaves priceHistory1d unset (honest "—"), never fabricated.
  try {
    const sinceTs = Math.floor(Date.now() / 1000) - PRICE_HISTORY_WINDOW_SEC
    const history = getPriceHistory(db, tok.chainId, poolKey, sinceTs, PRICE_HISTORY_BUCKET_SEC)
    const series = history
      .filter((pt) => Number.isFinite(pt.price) && pt.price > 0)
      .map(
        (pt) =>
          new TimestampedValue({
            // getPriceHistory buckets are unix SECONDS; every frontend consumer reads this field as
            // seconds (TerminalChartPanel normalizes ms→s only when > 1e12, others ignore the timestamp).
            timestamp: BigInt(pt.t),
            value: tokenIsToken0 ? pt.price : 1 / pt.price,
          }),
      )
    if (series.length) {
      stats.priceHistory1d = series
    }
  } catch {
    // DB/query failure — omit the series, keep the (already-computed) real priceChange1d. Never fabricate.
  }

  // ---- USD-anchored fields (gated on getUsdPerNative) ----
  // `price`/`volume1d` are USD-DENOMINATED in the UI (rendered behind a `$` via convertFiatAmountFormatted),
  // so they populate ONLY when this chain has an ingested wrapped-native/stablecoin anchor pool
  // (getUsdPerNative defined). Until that anchor exists, every USD field stays UNSET (honest "—") — the
  // native fields above are unaffected. Error-safe: any DB/metric failure leaves USD fields unset, never faked.
  try {
    const usdPerNative = getUsdPerNative(db, tok.chainId)
    if (usdPerNative !== undefined) {
      // Token's current spot price in the pool's wrapped-native quote, oriented to THIS token EXACTLY like
      // the priceChange1d/priceHistory1d orientation above: token0 → price(token0-in-token1=wrapped-native);
      // token1 → the inverse (price(token1-in-token0=wrapped-native)). getUsdPerNative × that = USD price.
      const spot = getSpotPriceNative(db, tok.chainId, poolKey)
      if (spot) {
        const priceInNative = tokenIsToken0 ? spot.priceToken0InToken1 : spot.priceToken1InToken0
        const priceUsd = getTokenPriceUsd(db, tok.chainId, priceInNative)
        if (priceUsd !== undefined && priceUsd > 0 && Number.isFinite(priceUsd)) {
          stats.price = priceUsd
        }
      }
      // 24h USD volume of the token's representative wrapped-native pool (native-leg flow × usdPerNative).
      const volumeUsd = getPoolVolumeUsd24h(db, tok.chainId, poolKey)
      if (volumeUsd !== undefined && volumeUsd >= 0 && Number.isFinite(volumeUsd)) {
        stats.volume1d = volumeUsd
      }
      // `fdv` deliberately left UNSET — needs circulating/total supply, which is not sourced on-chain here.
    }
  } catch {
    // Any USD/DB read failure → leave every USD field unset. Never throw, never fabricate.
  }

  return stats
}

// ---------- Event-indexer stats: USD-anchored pool metrics from the SQLite indexer ----------

/**
 * Build the `PoolStats` sub-message for one pool, USD-anchored. Returns undefined (→ `stats` omitted,
 * honest "—"/empty in the UI) unless the chain has an ingested wrapped-native/stablecoin anchor pool
 * (getUsdPerNative defined) AND at least one USD field could be sourced. NOTHING is fabricated: each
 * field is independently gated + finite-guarded, and any DB/metric failure leaves that field unset.
 *
 * FIELDS:
 *   - `tvl`      — full-pool USD TVL (native side × usdPerNative × 2). Requires a wrapped-native side.
 *   - `volume1d` — 24h USD volume (native-leg token flow × usdPerNative).
 *   - `apr`      — fee APR from the v2 0.30% fee, as a PERCENT: (volume1d × 0.003 × 365 / tvl) × 100.
 *       UNIT DECISION: the primary listTopPools consumer (convertDataApiPoolToPoolStat,
 *       useBackendSortedTopPools.ts:85-89) does NOT read `stats.apr` — it RECOMPUTES apr via
 *       calculateApr(volume24h,tvl,feeTier) (useTopPools.ts:47-60 = Percent(vol×0.003×365, tvl)), which
 *       MarketsScreen.tsx:206-207 renders as `pool.apr.toFixed(1)` → a PERCENT. So the value the UI shows
 *       equals (vol×0.003×365/tvl)×100; we emit `stats.apr` in that same PERCENT unit for consistency with
 *       any backend-sort / secondary consumer of the field.
 *   - `rewardApr`/`totalApr` — UNSET: no LP-incentive program, and no UI consumer reads totalApr
 *       (the consumer maps only `boostedApr: stats.rewardApr`).
 *   - `volume30d` — UNSET: the metrics layer exposes only a 24h USD volume helper (no 30d source).
 *
 * NOTE: the event indexer ingests only v2 Sync/Swap events, so v3 pools have no pool_meta → every
 * metric returns undefined → this returns undefined for v3 (honest empty), never faked.
 */
function buildPoolStats(db: SqliteDatabase, chainId: number, poolAddress: string): PoolStats | undefined {
  let usdPerNative: number | undefined
  try {
    usdPerNative = getUsdPerNative(db, chainId)
  } catch {
    return undefined
  }
  if (usdPerNative === undefined) {
    return undefined
  }
  // ingest.ts stores pool addresses lowercased → key the metrics read the same way.
  const poolKey = poolAddress.toLowerCase()
  const stats = new PoolStats()

  try {
    const tvlUsd = getPoolTvlUsd(db, chainId, poolKey)
    if (tvlUsd !== undefined && tvlUsd >= 0 && Number.isFinite(tvlUsd)) {
      stats.tvl = tvlUsd
    }
  } catch {
    // leave tvl unset
  }
  try {
    const volumeUsd = getPoolVolumeUsd24h(db, chainId, poolKey)
    if (volumeUsd !== undefined && volumeUsd >= 0 && Number.isFinite(volumeUsd)) {
      stats.volume1d = volumeUsd
    }
  } catch {
    // leave volume1d unset
  }
  // Fee APR from the v2 0.30% fee, as a PERCENT (see UNIT DECISION above). Only when both legs are real.
  if (stats.tvl !== undefined && stats.tvl > 0 && stats.volume1d !== undefined) {
    const aprPercent = ((stats.volume1d * 0.003 * 365) / stats.tvl) * 100
    if (Number.isFinite(aprPercent) && aprPercent >= 0) {
      stats.apr = aprPercent
    }
  }

  // Omit the whole stats message if nothing could be sourced (honest empty, not an all-zero object).
  if (stats.tvl === undefined && stats.volume1d === undefined && stats.apr === undefined) {
    return undefined
  }
  return stats
}

// ---------- REAL: listTokens ----------

async function handleListTokens(req: ListTokensRequest): Promise<ListTokensResponse> {
  const chainIds = resolveChainIds(req.chainIds)
  const tokens: Token[] = []
  // Reuse the v2 pairs discovered below to locate each token's representative wrapped-native pool
  // (for native-denominated stats), so we don't re-hit the RPC/cache a second time per token.
  const pairsByChain = new Map<number, V2PairData[]>()

  for (const chainId of chainIds) {
    const chain = getChain(chainId)
    if (!chain) {
      continue
    }
    // Native asset. NO on-chain contract, so `address` is left empty (the native sentinel) and
    // type = NATIVE. We do not invent a contract address for it.
    tokens.push(
      new Token({
        chainId,
        address: '',
        symbol: chain.nativeSymbol,
        name: chain.nativeSymbol,
        decimals: chain.nativeDecimals,
        type: TokenType.NATIVE,
      }),
    )
    // Wrapped-native (real ERC-20).
    tokens.push(
      toProtoErc20Token({
        chainId,
        address: chain.wrappedNative.address,
        symbol: chain.wrappedNative.symbol,
        name: chain.wrappedNative.name,
        decimals: chain.wrappedNative.decimals,
        isWrappedNative: true,
      }),
    )
    // Seeded tokens (real, verified ERC-20s).
    for (const t of chain.seededTokens ?? []) {
      tokens.push(
        toProtoErc20Token({ chainId, address: t.address, symbol: t.symbol, name: t.name, decimals: t.decimals, isWrappedNative: false }),
      )
    }
    // Tokens discovered in this chain's REAL on-chain v2 pools (metadata read live on-chain). This
    // surfaces tradable tokens that aren't in the curated seeded list (e.g. XLayer's on-chain HKT).
    // De-duplicated against the static tokens already added above (by lowercased address).
    const seen = new Set(tokens.filter((t) => t.chainId === chainId).map((t) => t.address.toLowerCase()))
    try {
      const pairs = await getV2PairsCached(chainId)
      pairsByChain.set(chainId, pairs)
      for (const p of pairs) {
        for (const meta of [p.token0, p.token1]) {
          const key = meta.address.toLowerCase()
          if (seen.has(key)) {
            continue
          }
          seen.add(key)
          tokens.push(toProtoErc20Token(meta))
        }
      }
    } catch {
      // RPC down for this chain — still return its static tokens (native + wrapped + seeded).
    }
    // Same for tokens discovered in this chain's REAL on-chain v3 pools (PoolCreated-log-discovered,
    // metadata read live on-chain). Deduped against everything already added (static + v2 tokens).
    try {
      const v3pools = await getV3PoolsCached(chainId)
      for (const p of v3pools) {
        for (const meta of [p.token0, p.token1]) {
          const key = meta.address.toLowerCase()
          if (seen.has(key)) {
            continue
          }
          seen.add(key)
          tokens.push(toProtoErc20Token(meta))
        }
      }
    } catch {
      // RPC down / no v3 discovery for this chain — non-fatal; static + v2 tokens still returned.
    }
  }

  // Build the `multichainTokens[]` the Markets/Landing/Analytics panels actually read (price, 24H %,
  // sparkline, movers). For HookSwap the same asset isn't bridged across our chains, so each entry is a
  // single-chain group (one `chainTokens[]` element). Core fields are always returned; `stats` is attached
  // only when the indexer yields a real, unit-safe native metric (see buildTokenStats) — otherwise omitted.
  let db: SqliteDatabase | undefined
  try {
    db = getDb()
  } catch {
    // Indexer DB unavailable (e.g. better-sqlite3 not installed in this env) — still return tokens,
    // just without stats. Never throw, never fabricate.
    db = undefined
  }
  const multichainTokens = tokens.map((tok) => {
    const mt = new MultichainToken({
      // Deterministic id; not used as a join key by the UI (it joins by chainToken address + symbol).
      multichainId: tok.address ? `${tok.chainId}:${tok.address.toLowerCase()}` : `${tok.chainId}:native`,
      symbol: tok.symbol,
      name: tok.name,
      type: tok.type,
      chainTokens: [
        new ChainToken({ chainId: tok.chainId, address: tok.address, decimals: tok.decimals }),
      ],
    })
    if (db) {
      const stats = buildTokenStats(db, tok, pairsByChain.get(tok.chainId))
      if (stats) {
        mt.stats = stats
      }
    }
    return mt
  })

  return new ListTokensResponse({ tokens, nextPageToken: '', multichainTokens })
}

// ---------- REAL: listTopPools ----------

async function handleListTopPools(req: ListTopPoolsRequest): Promise<ListTopPoolsResponse> {
  const chainIds = resolveChainIds(req.chainIds)
  const pools: Pool[] = []

  // Indexer DB handle for USD-anchored PoolStats. If unavailable (e.g. better-sqlite3 not installed),
  // every pool is still returned — just without stats (honest "—"). Never throw, never fabricate.
  let db: SqliteDatabase | undefined
  try {
    db = getDb()
  } catch {
    db = undefined
  }

  const perChain = await Promise.all(
    chainIds.map(async (chainId) => {
      try {
        return await getV2PairsCached(chainId)
      } catch {
        // A chain's RPC being down must not fail the whole response — serve the chains that answer.
        return [] as V2PairData[]
      }
    }),
  )

  for (const chainPairs of perChain) {
    for (const p of chainPairs) {
      const pool = new Pool({
        chainId: p.chainId,
        poolId: p.pairAddress,
        token0: toProtoErc20Token(p.token0),
        token1: toProtoErc20Token(p.token1),
        protocolVersion: ProtocolVersion.V2,
        feeTier: V2_FEE_TIER_PIPS,
        isDynamicFee: false,
      })
      // USD-anchored PoolStats (tvl / volume1d / apr). Populated ONLY once this chain has an ingested
      // wrapped-native/stablecoin anchor pool (getUsdPerNative defined); otherwise left UNSET (honest "—").
      // The pool itself (tokens, fee, existence) is always real, on-chain-verified. See buildPoolStats.
      if (db) {
        const stats = buildPoolStats(db, p.chainId, p.pairAddress)
        if (stats) {
          pool.stats = stats
        }
      }
      pools.push(pool)
    }
  }

  // v3 pools (PoolCreated-log-discovered, real on-chain balances). Same per-chain error-safety as v2.
  const perChainV3 = await Promise.all(
    chainIds.map(async (chainId) => {
      try {
        return await getV3PoolsCached(chainId)
      } catch {
        return [] as V3PoolData[]
      }
    }),
  )

  for (const chainV3 of perChainV3) {
    for (const p of chainV3) {
      const pool = new Pool({
        chainId: p.chainId,
        poolId: p.poolAddress,
        token0: toProtoErc20Token(p.token0),
        token1: toProtoErc20Token(p.token1),
        protocolVersion: ProtocolVersion.V3,
        // real v3 fee (pips, straight from the PoolCreated event) — NOT the fixed v2 0.30%.
        feeTier: p.fee,
        isDynamicFee: false,
      })
      // The event indexer currently ingests only v2 Sync/Swap events (see ingest.ts), so v3 pools have
      // no pool_meta → buildPoolStats returns undefined and stats stays UNSET (honest "—"). Wired anyway so
      // v3 USD stats light up automatically if/when v3 event ingestion is added. Never fabricated.
      if (db) {
        const stats = buildPoolStats(db, p.chainId, p.poolAddress)
        if (stats) {
          pool.stats = stats
        }
      }
      pools.push(pool)
    }
  }

  return new ListTopPoolsResponse({ pools, nextPageToken: '' })
}

// ---------- Build the full ServiceImpl: 2 real handlers + honest empty stubs for the rest ----------

/**
 * Every DataApiService method must be implemented for the Connect router. We implement listTokens
 * and listTopPools for real, and auto-generate an empty-response stub for every other method by
 * instantiating that method's response Message class (`methodInfo.O`) with no args — always a valid,
 * empty proto response. This is intentionally NOT an error/unimplemented: the interface treats an
 * empty response as "no data" and shows honest empty states rather than crashing.
 */
export function createDataApiImpl(): ServiceImpl<typeof DataApiService> {
  const impl: Record<string, (...args: unknown[]) => unknown> = {}

  for (const [methodName, methodInfo] of Object.entries(DataApiService.methods)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    impl[methodName] = () => new (methodInfo as any).O()
  }

  // Real implementations override the stubs.
  impl.listTokens = (req: unknown) => handleListTokens(req as ListTokensRequest)
  impl.listTopPools = (req: unknown) => handleListTopPools(req as ListTopPoolsRequest)

  return impl as unknown as ServiceImpl<typeof DataApiService>
}
