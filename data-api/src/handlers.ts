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
 *   - getPortfolio → a connected wallet's live on-chain token holdings on each requested chain: the same
 *                    token set listTokens surfaces, batch-read via balanceOf / eth_getBalance, returning
 *                    only non-zero balances with real raw + human quantities. USD (priceUsd/valueUsd) is
 *                    anchor-gated (unset until a WETH/USDG pool exists — see handleGetPortfolio).
 *   - listTransactions / getTransaction → a connected wallet's real swap history (Terminal Activity feed
 *                    + pool/token tx lists), built from the event indexer's `swap_events` (each stored
 *                    from a real on-chain v2 Swap log). Each swap maps to an OnChainTransaction(SWAP) with
 *                    a real SEND (input token) + RECEIVE (output token) Transfer, tx hash, block, and
 *                    timestamp. USD-valued transfer fields are left unset (no oracle — honest). Indexed
 *                    v2 swaps only (v3 Swap ingestion isn't wired yet — see buildPoolStats note).
 *   - listPositions → a connected wallet's live on-chain v2 LP positions (Terminal Positions screen): for
 *                    each of the chain's live v2 pairs, the owner's LP `balanceOf` + pair `totalSupply` give
 *                    the proportional underlying-reserve share (real raw + human quantities). USD value/fees
 *                    are left unset (no oracle). v2 only — v3 NFT positions deferred (see handleListPositions).
 *
 * The event indexer EXISTS and is deployed (gated on INDEXER_ENABLED): it tails Swap/Sync events into
 * SQLite and feeds the TokenStats/PoolStats + transaction history above. What the stats power NOW is
 * native metrics; USD-denominated fields stay unset until a stablecoin (USDG) anchor pool exists.
 *
 * STUBS (valid empty proto responses, NOT errors — so the interface degrades gracefully):
 *   - everything else (wallet balances, positions, charts, rewards, protocol stats, token
 *     prices, RWAs, token-factory, reports, ...). These need higher-level time-series / protocol-stats
 *     endpoints (NOT the event indexer, which is live) and/or a USD price oracle. Returning an
 *     empty-but-valid Message keeps the frontend from crashing (it renders honest empty/"—" states).
 *     NOTE: net worth / 24h PnL on the Terminal Portfolio come from GetWalletBalances (still stubbed,
 *     USD-aggregate-only), NOT GetPortfolio — they stay "—" until a USD anchor pool exists.
 *
 * NO FABRICATED DATA: value/USD/volume fields we can't source truthfully are left unset (proto
 * default / undefined), never invented. See the pricing note in onchain.ts.
 */

import type { ServiceImpl } from '@connectrpc/connect'
import { BigNumber, ethers } from 'ethers'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import {
  GetPortfolioRequest,
  GetPortfolioResponse,
  GetTransactionRequest,
  GetTransactionResponse,
  ListPositionsRequest,
  ListPositionsResponse,
  ListTokensRequest,
  ListTokensResponse,
  ListTopPoolsRequest,
  ListTopPoolsResponse,
  ListTransactionsRequest,
  ListTransactionsResponse,
  Platform,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  Amount,
  Balance,
  ChainToken,
  Direction,
  MultichainToken,
  OnChainTransaction,
  OnChainTransactionLabel,
  OnChainTransactionStatus,
  Pool,
  PoolStats,
  Portfolio,
  ProtocolMetadata,
  TimestampedValue,
  Token,
  TokenStats,
  TokenType,
  Transaction,
  TransactionTypeFilter,
  Transfer,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  PairPosition,
  Position,
  PositionStatus,
  ProtocolVersion,
} from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { getChain, isSupportedChain, supportedChainIds } from './chains'
import {
  getErc20Balance,
  getErc20TotalSupply,
  getNativeBalance,
  getTokenMeta,
  getV2Pairs,
  getV3Pools,
  TokenMeta,
  V2PairData,
  V3PoolData,
} from './onchain'
import {
  get24hPriceChangeNative,
  getPoolTvlUsd,
  getPoolVolumeUsd24h,
  getPriceHistory,
  getSpotPriceNative,
  getTokenPriceUsd,
  getUsdPerNative,
} from './indexer/metrics'
import {
  getDb,
  getPoolMeta,
  getSwapEventsByTx,
  getWalletSwapEvents,
  PoolMetaRow,
  SqliteDatabase,
  SwapEventRow,
} from './indexer/schema'

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

export async function getV2PairsCached(chainId: number): Promise<V2PairData[]> {
  const hit = poolsCache.get(chainId)
  const now = Date.now()
  if (hit && now - hit.at < POOLS_TTL_MS) {
    return hit.data
  }
  const data = await getV2Pairs(chainId)
  poolsCache.set(chainId, { at: now, data })
  return data
}

export async function getV3PoolsCached(chainId: number): Promise<V3PoolData[]> {
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

// ---------- REAL: getPortfolio ----------

/**
 * One token in a wallet's holdings on a chain, plus the flags needed to price it against the USD anchor.
 * Built from the SAME token set listTokens surfaces: native + wrapped-native + seeded ERC-20s + tokens
 * discovered in the chain's live v2/v3 pools (metadata read on-chain). `address` is '' for the native
 * asset (the native sentinel the interface treats as native — buildCurrency maps an empty address to
 * `nativeOnChain`).
 */
interface PortfolioTokenEntry {
  token: Token
  address: string
  decimals: number
  isNative: boolean
  isWrappedNative: boolean
}

/**
 * Collect the candidate token set for a wallet on one chain — identical sources to listTokens. Every
 * token here is real (static-verified or on-chain-discovered); balances are read separately. Never
 * throws: an RPC failure on the pool discovery just yields the static tokens (native + wrapped + seeded).
 */
async function collectPortfolioTokens(chainId: number): Promise<PortfolioTokenEntry[]> {
  const chain = getChain(chainId)
  if (!chain) {
    return []
  }
  const entries: PortfolioTokenEntry[] = []
  const seen = new Set<string>()

  // Native asset (no on-chain contract → empty address, type NATIVE).
  entries.push({
    token: new Token({
      chainId,
      address: '',
      symbol: chain.nativeSymbol,
      name: chain.nativeSymbol,
      decimals: chain.nativeDecimals,
      type: TokenType.NATIVE,
    }),
    address: '',
    decimals: chain.nativeDecimals,
    isNative: true,
    isWrappedNative: false,
  })

  const pushErc20 = (meta: TokenMeta): void => {
    const key = meta.address.toLowerCase()
    if (!key || seen.has(key)) {
      return
    }
    seen.add(key)
    entries.push({
      token: toProtoErc20Token(meta),
      address: meta.address,
      decimals: meta.decimals,
      isNative: false,
      isWrappedNative: meta.isWrappedNative,
    })
  }

  // Wrapped-native + seeded tokens (static, verified).
  pushErc20({
    chainId,
    address: chain.wrappedNative.address,
    symbol: chain.wrappedNative.symbol,
    name: chain.wrappedNative.name,
    decimals: chain.wrappedNative.decimals,
    isWrappedNative: true,
  })
  for (const t of chain.seededTokens ?? []) {
    pushErc20({ chainId, address: t.address, symbol: t.symbol, name: t.name, decimals: t.decimals, isWrappedNative: false })
  }

  // Tokens discovered in the chain's live v2 / v3 pools (metadata read on-chain).
  try {
    for (const p of await getV2PairsCached(chainId)) {
      pushErc20(p.token0)
      pushErc20(p.token1)
    }
  } catch {
    // RPC down — keep the static tokens already collected.
  }
  try {
    for (const p of await getV3PoolsCached(chainId)) {
      pushErc20(p.token0)
      pushErc20(p.token1)
    }
  } catch {
    // Non-fatal — static + v2 tokens still returned.
  }

  return entries
}

/**
 * USD spot price of ONE portfolio token, gated entirely on the chain's USD anchor (getUsdPerNative).
 * Returns undefined (→ valueUsd left unset, honest "—") unless the chain has an ingested wrapped-native/
 * stablecoin anchor pool. Native + wrapped-native are priced directly at usdPerNative; any other ERC-20
 * is priced via its representative wrapped-native v2 pool's reserve-derived native spot × usdPerNative
 * (same orientation as buildTokenStats). NOTHING is fabricated: no anchor / no native pool / any DB
 * failure → undefined. Lights up automatically once a WETH/USDG pool is seeded + indexed.
 */
function priceUsdForEntry(
  db: SqliteDatabase | undefined,
  chainId: number,
  entry: PortfolioTokenEntry,
  usdPerNative: number | undefined,
  pairs: V2PairData[],
): number | undefined {
  if (!db || usdPerNative === undefined) {
    return undefined
  }
  // Native and wrapped-native are 1:1 in value → priced directly at the anchor's usdPerNative.
  if (entry.isNative || entry.isWrappedNative) {
    return usdPerNative
  }
  const chain = getChain(chainId)
  if (!chain) {
    return undefined
  }
  const wnative = chain.wrappedNative.address.toLowerCase()
  const addr = entry.address.toLowerCase()
  // Representative pool = this token's pair vs the chain's wrapped-native.
  const pair = pairs.find((p) => {
    const a0 = p.token0.address.toLowerCase()
    const a1 = p.token1.address.toLowerCase()
    return (a0 === addr && a1 === wnative) || (a1 === addr && a0 === wnative)
  })
  if (!pair) {
    return undefined
  }
  try {
    const spot = getSpotPriceNative(db, chainId, pair.pairAddress.toLowerCase())
    if (!spot) {
      return undefined
    }
    const tokenIsToken0 = pair.token0.address.toLowerCase() === addr
    const priceInNative = tokenIsToken0 ? spot.priceToken0InToken1 : spot.priceToken1InToken0
    const priceUsd = getTokenPriceUsd(db, chainId, priceInNative)
    return priceUsd !== undefined && priceUsd > 0 && Number.isFinite(priceUsd) ? priceUsd : undefined
  } catch {
    return undefined
  }
}

/**
 * REAL portfolio: a connected wallet's live on-chain token holdings on each requested supported chain.
 *
 * For the request's EVM address(es), on each chain we take the SAME token set listTokens surfaces and
 * batch-read the raw on-chain balance of each (native via eth_getBalance, ERC-20 via balanceOf), summed
 * across the provided addresses. Only tokens with a NON-ZERO balance are returned. `amount.raw` is the
 * exact base-unit balance; `amount.amount` is the decimal-adjusted human quantity (a double, matching
 * the proto + the interface's `convertRestBalanceToPortfolioBalance`, which gates on amount.amount > 0).
 *
 * USD is anchor-gated: `priceUsd`/`valueUsd` populate ONLY when the chain has an ingested wrapped-native/
 * stablecoin anchor pool (see priceUsdForEntry). Until that pool is seeded there is NO truthful USD price
 * source on these chains, so every USD field is left UNSET (proto default 0) — the interface renders an
 * honest "—"/$0 for per-token value while token QUANTITIES still populate (and flow into the token
 * selector, account drawer, and any quantity consumer). NEVER fabricated; the USD fields light up
 * automatically once a WETH/USDG pool exists. Aggregate portfolio totals (totalValueUsd/…change) are
 * likewise left unset until the anchor exists.
 *
 * NOTE on the Terminal Portfolio screen specifically: its net-worth/24h KPIs read GetWalletBalances (a
 * different, USD-aggregate-only method, still stubbed) and its allocation donut is weighted by USD value
 * (buildAllocation filters valueUsd > 0). Both therefore stay "—"/empty until the USD anchor exists —
 * NOT because of this handler. This handler makes the real per-token quantities available; visible USD on
 * that screen is gated on liquidity (the WETH/USDG anchor pool), by design.
 *
 * `pricePercentChange1d` is left unset: it is a USD price change in the UI, and no USD price history is
 * sourced here — reusing a native ratio would mislabel it (same rule as buildTokenStats).
 */
async function handleGetPortfolio(req: GetPortfolioRequest): Promise<GetPortfolioResponse> {
  const chainIds = resolveChainIds(req.chainIds)
  // The interface sends the wallet as walletAccount.platformAddresses (see @universe/api transformInput).
  // We read EVM addresses only — these chains are all EVM; SVM (Solana) is not a HookSwap chain.
  const evmAddresses = (req.walletAccount?.platformAddresses ?? [])
    .filter((p) => p.platform === Platform.EVM && !!p.address)
    .map((p) => p.address)
  if (evmAddresses.length === 0) {
    // No EVM address → honest empty portfolio (valid, not an error).
    return new GetPortfolioResponse({ portfolio: new Portfolio() })
  }

  // Indexer DB handle for the USD anchor. Unavailable (e.g. better-sqlite3 not installed) → balances
  // are still returned, just without USD. Never throw, never fabricate.
  let db: SqliteDatabase | undefined
  try {
    db = getDb()
  } catch {
    db = undefined
  }

  const perChainBalances = await Promise.all(
    chainIds.map(async (chainId): Promise<Balance[]> => {
      const entries = await collectPortfolioTokens(chainId)
      // v2 pairs (cached) for per-token USD pricing against the wrapped-native; empty on RPC failure.
      let pairs: V2PairData[] = []
      try {
        pairs = await getV2PairsCached(chainId)
      } catch {
        pairs = []
      }
      let usdPerNative: number | undefined
      if (db) {
        try {
          usdPerNative = getUsdPerNative(db, chainId)
        } catch {
          usdPerNative = undefined
        }
      }

      const balances = await Promise.all(
        entries.map(async (entry): Promise<Balance | undefined> => {
          // Sum the raw balance across every provided EVM address (the interface sends one).
          let total = BigNumber.from(0)
          for (const owner of evmAddresses) {
            try {
              const bal = entry.isNative
                ? await getNativeBalance(chainId, owner)
                : await getErc20Balance(chainId, entry.address, owner)
              total = total.add(bal)
            } catch {
              // RPC hiccup / non-conforming contract for this owner+token — skip it, never fabricate.
            }
          }
          if (total.isZero()) {
            return undefined
          }
          const amount = new Amount({
            raw: total.toString(),
            amount: Number(ethers.utils.formatUnits(total, entry.decimals)),
          })
          const balance = new Balance({ token: entry.token, amount })
          // USD (anchor-gated). Left unset (0) when there's no anchor → honest "—" in the UI.
          const priceUsd = priceUsdForEntry(db, chainId, entry, usdPerNative, pairs)
          if (priceUsd !== undefined) {
            balance.priceUsd = priceUsd
            balance.valueUsd = amount.amount * priceUsd
          }
          return balance
        }),
      )
      return balances.filter((b): b is Balance => b !== undefined)
    }),
  )

  const balances = perChainBalances.flat()
  const portfolio = new Portfolio({ balances })

  // Aggregate totals are USD-denominated → populate ONLY when every returned balance carries a real
  // valueUsd (i.e. the anchor exists). Otherwise leave totalValueUsd unset (0) → honest "—" net worth.
  // (totalValue* change fields need USD price history we don't source → always left unset.)
  if (balances.length > 0 && balances.every((b) => b.valueUsd > 0)) {
    portfolio.totalValueUsd = balances.reduce((sum, b) => sum + b.valueUsd, 0)
  }

  return new GetPortfolioResponse({ portfolio })
}

// ---------- REAL: listTransactions / getTransaction (wallet swap history from the indexer) ----------

/**
 * Hard cap on how many of a wallet's most-recent swap events we pull per chain per request. A single
 * wallet's swap history on these chains is small; this bounds memory and keeps pagination deterministic
 * (the same query each page → stable slices). A wallet with > this many swaps won't page past the cap
 * (honest limit, documented) — not a correctness issue for launch-scale history.
 */
const WALLET_SWAP_ROW_CAP = 5_000
/** Default / max page size for ListTransactions when the request omits/oversizes pageSize. */
const DEFAULT_TX_PAGE_SIZE = 50
const MAX_TX_PAGE_SIZE = 100

/** One resolved leg of a swap (a token side + the exact raw amount that flowed). */
interface SwapLeg {
  address: string
  decimals: number
  symbol: string
  raw: BigNumber
}

/**
 * Resolve the input (token sent to the pool) and output (token received) legs of a single v2 Swap
 * row against its pool_meta. A well-formed v2 swap has exactly one non-zero *In and the opposite *Out;
 * returns undefined for a degenerate/unpaired row (never fabricates a leg).
 */
function resolveSwapLegs(row: SwapEventRow, meta: PoolMetaRow): { input: SwapLeg; output: SwapLeg } | undefined {
  const a0In = BigNumber.from(row.amount0In)
  const a1In = BigNumber.from(row.amount1In)
  const a0Out = BigNumber.from(row.amount0Out)
  const a1Out = BigNumber.from(row.amount1Out)
  if (a0In.gt(0) && a1Out.gt(0)) {
    return {
      input: { address: meta.token0, decimals: meta.decimals0, symbol: meta.symbol0, raw: a0In },
      output: { address: meta.token1, decimals: meta.decimals1, symbol: meta.symbol1, raw: a1Out },
    }
  }
  if (a1In.gt(0) && a0Out.gt(0)) {
    return {
      input: { address: meta.token1, decimals: meta.decimals1, symbol: meta.symbol1, raw: a1In },
      output: { address: meta.token0, decimals: meta.decimals0, symbol: meta.symbol0, raw: a0Out },
    }
  }
  return undefined
}

/** Build a Transfer for one swap leg (real token + exact raw + decimal-adjusted human amount). */
function makeTransfer(leg: SwapLeg, chainId: number, direction: Direction, from: string, to: string): Transfer {
  return new Transfer({
    direction,
    from,
    to,
    asset: {
      case: 'token',
      value: new Token({
        chainId,
        address: leg.address,
        symbol: leg.symbol,
        name: leg.symbol,
        decimals: leg.decimals,
        type: TokenType.ERC20,
      }),
    },
    amount: new Amount({
      raw: leg.raw.toString(),
      amount: Number(ethers.utils.formatUnits(leg.raw, leg.decimals)),
    }),
  })
}

/**
 * Assemble one OnChainTransaction(SWAP) for a wallet from the input/output legs of a transaction's
 * swap(s). For a multi-hop tx the input is the FIRST hop's input and the output is the LAST hop's
 * output (the user-facing net swap). Two Transfers (SEND input, RECEIVE output) from the wallet's
 * perspective — exactly what the interface's parseSwapTransaction consumes.
 *
 * `from` is set to the wallet this feed is for. HONEST CAVEAT: the v2 Swap event does not carry the
 * tx-origin EOA, so `from` is the indexed swap participant (Swap.to / Swap.sender we matched on), not
 * a separately-sourced tx sender. `status` = CONFIRMED (the event is mined). USD-valued fields are
 * left unset (no oracle). `fee`/gas is not indexed → left unset (interface renders no network fee).
 */
function assembleSwapTransaction(args: {
  chainId: number
  blockNumber: number
  timestampSec: number
  txHash: string
  sendPool: string
  recvPool: string
  owner: string
  input: SwapLeg
  output: SwapLeg
}): OnChainTransaction {
  const { chainId, blockNumber, timestampSec, txHash, sendPool, recvPool, owner, input, output } = args
  return new OnChainTransaction({
    chainId,
    blockNumber,
    // block timestamps are unix SECONDS; the proto field is uint64 MILLIS (bigint). timestampSec*1000
    // stays well under 2^53 so the Number multiply is exact before widening to bigint.
    timestampMillis: BigInt(timestampSec * 1000),
    transactionHash: txHash,
    from: owner,
    to: sendPool,
    transfers: [
      makeTransfer(input, chainId, Direction.SEND, owner, sendPool),
      makeTransfer(output, chainId, Direction.RECEIVE, recvPool, owner),
    ],
    label: OnChainTransactionLabel.SWAP,
    status: OnChainTransactionStatus.CONFIRMED,
    // Real: these pools are HookSwap's own v2 deployment. No fabricated logo (unset).
    protocol: new ProtocolMetadata({ name: 'HookSwap' }),
  })
}

/** pool_meta lookup with a per-request cache (many swaps share a pool). */
function poolMetaCached(
  db: SqliteDatabase,
  cache: Map<string, PoolMetaRow | undefined>,
  chainId: number,
  pool: string,
): PoolMetaRow | undefined {
  const key = `${chainId}:${pool}`
  if (!cache.has(key)) {
    let meta: PoolMetaRow | undefined
    try {
      meta = getPoolMeta(db, chainId, pool)
    } catch {
      meta = undefined
    }
    cache.set(key, meta)
  }
  return cache.get(key)
}

/**
 * Collapse all swap rows of ONE transaction (multi-hop = several) into a single net OnChainTransaction.
 * Returns undefined when pool_meta is missing or the legs are unresolvable (skip — never fabricate).
 */
function buildTxFromSwapRows(
  db: SqliteDatabase,
  metaCache: Map<string, PoolMetaRow | undefined>,
  rows: SwapEventRow[],
  owner: string,
): OnChainTransaction | undefined {
  const sorted = [...rows].sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (!first || !last) {
    return undefined
  }
  const firstMeta = poolMetaCached(db, metaCache, first.chainId, first.pool)
  const lastMeta = poolMetaCached(db, metaCache, last.chainId, last.pool)
  if (!firstMeta || !lastMeta) {
    return undefined
  }
  const firstLegs = resolveSwapLegs(first, firstMeta)
  const lastLegs = resolveSwapLegs(last, lastMeta)
  if (!firstLegs || !lastLegs) {
    return undefined
  }
  return assembleSwapTransaction({
    chainId: first.chainId,
    blockNumber: last.blockNumber,
    timestampSec: last.timestamp,
    txHash: last.txHash,
    sendPool: first.pool,
    recvPool: last.pool,
    owner,
    input: firstLegs.input,
    output: lastLegs.output,
  })
}

/** Whether swaps should be included given the request's type filter (empty/UNSPECIFIED/SWAP → yes). */
function swapsIncludedByFilter(filters: TransactionTypeFilter[]): boolean {
  if (!filters || filters.length === 0) {
    return true
  }
  return filters.some((f) => f === TransactionTypeFilter.UNSPECIFIED || f === TransactionTypeFilter.SWAP)
}

/** Case-insensitive substring match of a searchText against a built swap tx's real token metadata + hash. */
function txMatchesSearch(tx: OnChainTransaction, search: string): boolean {
  if (tx.transactionHash.toLowerCase().includes(search)) {
    return true
  }
  for (const transfer of tx.transfers) {
    const token = transfer.asset.case === 'token' ? transfer.asset.value : undefined
    if (!token) {
      continue
    }
    if (token.symbol.toLowerCase().includes(search) || token.address.toLowerCase().includes(search)) {
      return true
    }
  }
  return false
}

function clampPageSize(pageSize: number | undefined): number {
  if (!pageSize || !Number.isFinite(pageSize) || pageSize <= 0) {
    return DEFAULT_TX_PAGE_SIZE
  }
  return Math.min(Math.floor(pageSize), MAX_TX_PAGE_SIZE)
}

/** Parse the opaque pageToken (a non-negative integer offset). Bad/absent → 0. */
function parseOffset(pageToken: string | undefined): number {
  if (!pageToken) {
    return 0
  }
  const n = Number(pageToken)
  return Number.isInteger(n) && n >= 0 ? n : 0
}

/**
 * REAL: a connected wallet's swap history across the requested supported chains, from the indexer's
 * swap_events. Each transaction (multi-hop collapsed) → one OnChainTransaction(SWAP). Honors the
 * request's wallet (walletAccount), chainIds, filterTransactionTypes (swap-only source), searchText,
 * and offset/pageSize pagination. Honest-empty (valid response) when: no EVM wallet, the type filter
 * excludes swaps, the indexer DB is unavailable, or nothing matches. NEVER throws, NEVER fabricates.
 */
async function handleListTransactions(req: ListTransactionsRequest): Promise<ListTransactionsResponse> {
  const empty = new ListTransactionsResponse({ transactions: [], nextPageToken: '' })

  const chainIds = resolveChainIds(req.chainIds)
  const evmAddresses = (req.walletAccount?.platformAddresses ?? [])
    .filter((p) => p.platform === Platform.EVM && !!p.address)
    .map((p) => p.address)
  if (evmAddresses.length === 0 || chainIds.length === 0) {
    return empty
  }
  if (!swapsIncludedByFilter(req.filterTransactionTypes)) {
    // Only swap history is indexed → a filter that excludes swaps has nothing to return (honest empty).
    return empty
  }

  let db: SqliteDatabase | undefined
  try {
    db = getDb()
  } catch {
    // Indexer DB unavailable (e.g. better-sqlite3 not installed) — honest empty, never crash.
    db = undefined
  }
  if (!db) {
    return empty
  }

  const pageSize = clampPageSize(req.pageSize)
  const offset = parseOffset(req.pageToken)
  const search = (req.searchText ?? '').trim().toLowerCase()
  const walletsLower = evmAddresses.map((a) => a.toLowerCase())
  // `from`/owner shown on each tx: the request's first EVM address (original casing).
  const owner = evmAddresses[0]

  const metaCache = new Map<string, PoolMetaRow | undefined>()
  const built: { tx: OnChainTransaction; ts: number; block: number }[] = []

  for (const chainId of chainIds) {
    let rows: SwapEventRow[]
    try {
      rows = getWalletSwapEvents(db, chainId, walletsLower, WALLET_SWAP_ROW_CAP)
    } catch {
      // One chain's read failing must not fail the whole feed — skip it.
      continue
    }
    // Group this chain's rows by tx hash (multi-hop = several swap logs → one user-facing swap).
    const byTx = new Map<string, SwapEventRow[]>()
    for (const row of rows) {
      const key = row.txHash.toLowerCase()
      const list = byTx.get(key)
      if (list) {
        list.push(row)
      } else {
        byTx.set(key, [row])
      }
    }
    for (const group of byTx.values()) {
      const tx = buildTxFromSwapRows(db, metaCache, group, owner)
      if (!tx) {
        continue
      }
      if (search && !txMatchesSearch(tx, search)) {
        continue
      }
      const last = group.reduce((acc, r) =>
        r.blockNumber > acc.blockNumber || (r.blockNumber === acc.blockNumber && r.logIndex > acc.logIndex) ? r : acc,
      )
      built.push({ tx, ts: last.timestamp, block: last.blockNumber })
    }
  }

  // Newest first, stable across chains.
  built.sort((a, b) => b.ts - a.ts || b.block - a.block)

  const pageItems = built.slice(offset, offset + pageSize)
  const hasMore = built.length > offset + pageSize
  const transactions = pageItems.map(
    (b) => new Transaction({ transaction: { case: 'onChain', value: b.tx } }),
  )
  return new ListTransactionsResponse({
    transactions,
    nextPageToken: hasMore ? String(offset + pageSize) : '',
  })
}

/**
 * REAL: a single transaction by hash, from the indexer's swap_events (multi-hop collapsed to one net
 * swap). Honest-empty (transaction unset) when the chain is unsupported, the hash is absent, the DB is
 * unavailable, or no swap is indexed for that hash. NEVER throws, NEVER fabricates.
 */
async function handleGetTransaction(req: GetTransactionRequest): Promise<GetTransactionResponse> {
  const empty = new GetTransactionResponse({})
  if (!isSupportedChain(req.chainId) || !req.hash) {
    return empty
  }
  let db: SqliteDatabase | undefined
  try {
    db = getDb()
  } catch {
    db = undefined
  }
  if (!db) {
    return empty
  }
  let rows: SwapEventRow[]
  try {
    rows = getSwapEventsByTx(db, req.chainId, req.hash.toLowerCase())
  } catch {
    return empty
  }
  if (rows.length === 0) {
    return empty
  }
  // Owner: the caller-supplied address if present, else the last hop's on-chain recipient.
  const owner = req.address || rows[rows.length - 1].recipient
  const tx = buildTxFromSwapRows(db, new Map<string, PoolMetaRow | undefined>(), rows, owner)
  if (!tx) {
    return empty
  }
  return new GetTransactionResponse({
    transaction: new Transaction({ transaction: { case: 'onChain', value: tx } }),
  })
}

// ---------- REAL: listPositions (a wallet's live on-chain v2 LP positions) ----------

/**
 * REAL positions: a connected wallet's live on-chain Uniswap-v2 LP positions on each requested supported
 * chain. NATIVE-ONLY / USD-UNSET, same honesty rule as every other handler here.
 *
 * For the request's `address` on each chain: enumerate the chain's live v2 pairs (getV2PairsCached — the
 * authoritative factory + seeded-combo discovery already used by listTopPools), then for each pair read the
 * owner's LP-token `balanceOf` (the pair contract IS an ERC-20) and the pair `totalSupply()`. A zero LP
 * balance means no position → skip. Otherwise the owner's underlying share of each reserve is
 *   underlyingN = reserveN × lpBalance ÷ totalSupply   (integer BigNumber math, base units).
 * Each position is emitted as a pools.v1.Position{ v2Pair: PairPosition } carrying REAL on-chain quantities:
 *   - token0 / token1        — the pair's tokens (metadata already loaded by pool discovery).
 *   - liquidityToken         — the LP token = the pair contract itself (its address is the parser's poolId).
 *   - reserve0 / reserve1    — live pool reserves (raw).
 *   - liquidity              — the owner's LP-token balance (raw).
 *   - liquidity0 / liquidity1 — the owner's underlying token0/token1 amounts (raw).
 *   - totalSupply            — the pool's total LP supply (raw).
 * protocolVersion = V2; status = IN_RANGE (a v2 LP has no ticks — it is always active across the full range).
 *
 * DELIBERATELY UNSET (never fabricated): Position.valueUsd / uncollectedFeesUsd and PairPosition.apr — all
 * USD/fee-yield derived, and no USD oracle exists on these chains yet (same invariant as getPortfolio /
 * buildPoolStats). The interface renders honest "—" for those. `timestamp` is left 0 (no position-open
 * timestamp is sourced on-chain here).
 *
 * SCOPE — v2 ONLY (v3 NFT positions intentionally deferred): the v3 Position path (parseRestPosition.ts:289)
 * requires per-position amount0/amount1 + uncollected-fee reconstruction (LiquidityAmounts + fee-growth
 * math off the NPM `positions(tokenId)` + pool slot0/tick reads). That is complex and easy to get subtly
 * wrong, and NO v3 liquidity is seeded on any HookSwap chain yet (all seed scripts are v2 — see onchain.ts
 * v3-scan note), so there are zero real v3 positions to return today. Returning them half-built would
 * fabricate amounts, so v3 is a clean follow-up rather than a half-implementation.
 *
 * Error-safe: an RPC failure on a chain (or a single pair) is caught and that chain/pair contributes
 * nothing — never throws a fabricated result. No matching address / no LP anywhere → an empty-but-valid
 * ListPositionsResponse. Pagination is a single page (nextPageToken unset): the position set per wallet on
 * these chains is small, and the frontend's infinite query treats a falsy nextPageToken as "done".
 */
async function handleListPositions(req: ListPositionsRequest): Promise<ListPositionsResponse> {
  const owner = req.address
  if (!owner) {
    // No owner address → honest empty positions (valid, not an error).
    return new ListPositionsResponse({ positions: [], nextPageToken: '' })
  }
  const chainIds = resolveChainIds(req.chainIds)
  // Respect the protocol-version filter when present; we only produce V2. If the caller explicitly asked
  // for versions that don't include V2, there is nothing for us to return.
  const wantsV2 = req.protocolVersions.length === 0 || req.protocolVersions.includes(ProtocolVersion.V2)
  if (!wantsV2) {
    return new ListPositionsResponse({ positions: [], nextPageToken: '' })
  }

  // Optional request filters (used e.g. by the pool-details page, which asks for one pool). Honoring them
  // narrows the pairs we read (fewer RPC calls) AND keeps single-pool callers from seeing other pools.
  const poolIdFilter = req.poolId?.toLowerCase()
  const token0Filter = req.token0?.toLowerCase()
  const token1Filter = req.token1?.toLowerCase()

  const perChain = await Promise.all(
    chainIds.map(async (chainId): Promise<Position[]> => {
      let pairs: V2PairData[]
      try {
        pairs = await getV2PairsCached(chainId)
      } catch {
        // A chain's RPC being down must not fail the whole response — serve the chains that answer.
        return []
      }

      const filteredPairs = pairs.filter((pair) => {
        // poolId (v2) is the pair/LP-token address (the parser's poolId).
        if (poolIdFilter && pair.pairAddress.toLowerCase() !== poolIdFilter) {
          return false
        }
        // token0/token1 are an unordered token pair filter; match against either orientation.
        if (token0Filter || token1Filter) {
          const a0 = pair.token0.address.toLowerCase()
          const a1 = pair.token1.address.toLowerCase()
          const set = new Set([a0, a1])
          if (token0Filter && !set.has(token0Filter)) {
            return false
          }
          if (token1Filter && !set.has(token1Filter)) {
            return false
          }
        }
        return true
      })

      const positions = await Promise.all(
        filteredPairs.map(async (pair): Promise<Position | undefined> => {
          try {
            // The pair contract is itself an ERC-20: balanceOf(owner) = LP tokens held; totalSupply() = all LP.
            const [lpBalance, totalSupply] = await Promise.all([
              getErc20Balance(chainId, pair.pairAddress, owner),
              getErc20TotalSupply(chainId, pair.pairAddress),
            ])
            // No LP balance → no position here. Zero supply → nothing to proportion against; skip honestly.
            if (lpBalance.isZero() || totalSupply.isZero()) {
              return undefined
            }
            // Owner's underlying share of each reserve (integer base units): reserveN × lpBalance ÷ totalSupply.
            const underlying0 = pair.reserve0.mul(lpBalance).div(totalSupply)
            const underlying1 = pair.reserve1.mul(lpBalance).div(totalSupply)
            // LP-token metadata read live on-chain (canonical UniswapV2 ERC-20: symbol/name/decimals). Its
            // address is the pair address, which the parser uses as the position's poolId.
            const lpMeta = await getTokenMeta(chainId, pair.pairAddress)

            const pairPosition = new PairPosition({
              token0: toProtoErc20Token(pair.token0),
              token1: toProtoErc20Token(pair.token1),
              liquidityToken: toProtoErc20Token(lpMeta),
              reserve0: pair.reserve0.toString(),
              reserve1: pair.reserve1.toString(),
              liquidity: lpBalance.toString(),
              liquidity0: underlying0.toString(),
              liquidity1: underlying1.toString(),
              totalSupply: totalSupply.toString(),
              // apr left unset (0) — fee-yield/USD derived, no source on these chains yet.
            })

            return new Position({
              chainId,
              protocolVersion: ProtocolVersion.V2,
              position: { case: 'v2Pair', value: pairPosition },
              // v2 has no tick range → the position is always active/in-range (honest, not fabricated).
              status: PositionStatus.IN_RANGE,
              // timestamp/isHidden/valueUsd/uncollectedFeesUsd intentionally unset (no truthful source).
            })
          } catch {
            // RPC hiccup / non-conforming contract for this pair — skip it, never fabricate a position.
            return undefined
          }
        }),
      )
      return positions.filter((p): p is Position => p !== undefined)
    }),
  )

  return new ListPositionsResponse({ positions: perChain.flat(), nextPageToken: '' })
}

// ---------- Build the full ServiceImpl: real handlers + honest empty stubs for the rest ----------

/**
 * Every DataApiService method must be implemented for the Connect router. We implement listTokens,
 * listTopPools, getPortfolio, listTransactions, getTransaction and listPositions for real, and auto-generate
 * an empty-response stub for every other method by instantiating that method's response Message class
 * (`methodInfo.O`) with no args — always a valid, empty proto response. This is intentionally NOT an
 * error/unimplemented: the interface treats an empty response as "no data" and shows honest empty
 * states rather than crashing.
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
  impl.getPortfolio = (req: unknown) => handleGetPortfolio(req as GetPortfolioRequest)
  impl.listTransactions = (req: unknown) => handleListTransactions(req as ListTransactionsRequest)
  impl.getTransaction = (req: unknown) => handleGetTransaction(req as GetTransactionRequest)
  impl.listPositions = (req: unknown) => handleListPositions(req as ListPositionsRequest)

  return impl as unknown as ServiceImpl<typeof DataApiService>
}
