/**
 * GraphQL resolvers wiring the interface's gateway operations to the v3-subgraph.
 *
 * Only the SUBGRAPH-SERVEABLE operations are implemented here. Everything else is handled by the
 * upstream proxy in server.ts (a request is proxied whenever ANY selected root field is not in
 * `LOCAL_QUERY_FIELDS` below). So adding a new subgraph-backed op = implement its Query resolver
 * here AND add its field name to `LOCAL_QUERY_FIELDS`.
 *
 * Root operations implemented (see README "resolver coverage"):
 *   - Query.topV3Pools          (TopV3Pools)
 *   - Query.v3Pool              (V3Pool)
 *   - Query.v3PoolsForTokenPair (FeeTierDistribution)
 *   - Query.token               (TokenSpotPrice / TokenWeb / TokenPrice / Token*Transactions / charts)
 *   - Query.tokens              (UniswapPrices / Tokens / HomeScreenTokens)
 *   - Query.topTokens           (TopTokens)
 *   - Query.v3Transactions      (V3Transactions)
 *   - Query.isV3SubgraphStale   (bonus; `_meta` probe)
 *
 * Field resolvers implemented (args-bearing, lazily query the subgraph on demand):
 *   - V3Pool.cumulativeVolume / historicalVolume / priceHistory / transactions / ticks /
 *     totalLiquidityPercentChange24h   (V3PoolTransactions, PoolPriceHistory, PoolVolumeHistory, AllV3Ticks)
 *   - Token.market / v3Transactions      (V3TokenTransactions)
 *   - TokenMarket.price / totalValueLocked / fullyDilutedValuation / volume / historicalVolume /
 *     historicalTvl / priceHistory / ohlc / pricePercentChange / priceHighLow
 *     (TokenWeb, TokenHistoricalTvls, TokenHistoricalVolumes, TokenPrice)
 *   - Token.market's project.markets price (TokenSpotPrice / UniswapPrices)
 */

import { getChainByEnum, resolveSubgraphUrl, type ChainConfig } from './chains'
import { querySubgraph } from './subgraphClient'
import {
  buildTokenMarket,
  durationToWindow,
  poolCumulativeVolume,
  poolTvlPercentChange24h,
  priceHighLow,
  pricePercentChange,
  sumVolume,
  toAmount,
  toGwPoolTransaction,
  toGwToken,
  toGwV3Pool,
  toGwV3PoolTick,
  toPriceAmount,
  toSeriesRow,
  toTimestampedAmount,
  toTimestampedOhlc,
  tokenPriceUSD,
  type GwPoolTransaction,
  type GwToken,
  type GwTokenMarket,
  type GwTokenProject,
  type GwV3Pool,
  type SeriesRow,
  type SgBundle,
  type SgPool,
  type SgPoolEvent,
  type SgSnapshot,
  type SgTick,
  type SgToken,
} from './translate'
import type { GatewayChain } from './chains'

/**
 * Root Query fields this adapter serves from the subgraph. A GraphQL request is executed locally
 * ONLY if every one of its selected root fields is in this set; otherwise it is proxied upstream.
 * Keep this in sync with the resolvers defined below.
 */
export const LOCAL_QUERY_FIELDS: ReadonlySet<string> = new Set<string>([
  'topV3Pools',
  'v3Pool',
  'v3PoolsForTokenPair',
  'v3Transactions',
  'token',
  'tokens',
  'topTokens',
  'isV3SubgraphStale',
])

// ------------------------------------------------------------------ subgraph query documents

const POOL_FIELDS = `
  id
  feeTier
  liquidity
  sqrtPrice
  tick
  token0 { id symbol name decimals totalSupply derivedETH }
  token1 { id symbol name decimals totalSupply derivedETH }
  token0Price
  token1Price
  volumeUSD
  txCount
  totalValueLockedUSD
  totalValueLockedToken0
  totalValueLockedToken1
  poolDayData(first: 30, orderBy: date, orderDirection: desc) { date volumeUSD tvlUSD }
`

const TOKEN_ENTITY_FIELDS = `id symbol name decimals totalSupply derivedETH volumeUSD totalValueLockedUSD`

const TOP_POOLS_QUERY = `
  query TopPools($first: Int!, $where: Pool_filter) {
    pools(first: $first, orderBy: totalValueLockedUSD, orderDirection: desc, where: $where) {
      ${POOL_FIELDS}
    }
  }
`

const POOL_QUERY = `
  query Pool($id: ID!) {
    pool(id: $id) { ${POOL_FIELDS} }
    bundle(id: "1") { ethPriceUSD }
  }
`

const POOLS_FOR_PAIR_QUERY = `
  query PoolsForPair($t0: String!, $t1: String!) {
    a: pools(where: { token0: $t0, token1: $t1 }, orderBy: totalValueLockedUSD, orderDirection: desc) { ${POOL_FIELDS} }
    b: pools(where: { token0: $t1, token1: $t0 }, orderBy: totalValueLockedUSD, orderDirection: desc) { ${POOL_FIELDS} }
    bundle(id: "1") { ethPriceUSD }
  }
`

const TOKEN_QUERY = `
  query TokenById($id: ID!) {
    token(id: $id) { ${TOKEN_ENTITY_FIELDS} }
    bundle(id: "1") { ethPriceUSD }
  }
`

const TOKENS_QUERY = `
  query TokensByIds($ids: [ID!]!) {
    tokens(where: { id_in: $ids }) { ${TOKEN_ENTITY_FIELDS} }
    bundle(id: "1") { ethPriceUSD }
  }
`

const TOP_TOKENS_QUERY = `
  query TopTokens($first: Int!, $skip: Int!, $orderBy: Token_orderBy!) {
    tokens(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: desc) { ${TOKEN_ENTITY_FIELDS} }
    bundle(id: "1") { ethPriceUSD }
  }
`

const META_QUERY = `
  query Meta {
    _meta { hasIndexingErrors block { number } }
  }
`

const TOKEN_DAY_QUERY = `
  query TokenDayData($token: String!, $first: Int!) {
    tokenDayDatas(first: $first, orderBy: date, orderDirection: desc, where: { token: $token }) {
      date volumeUSD totalValueLockedUSD priceUSD open high low close
    }
  }
`

const TOKEN_HOUR_QUERY = `
  query TokenHourData($token: String!, $first: Int!) {
    tokenHourDatas(first: $first, orderBy: periodStartUnix, orderDirection: desc, where: { token: $token }) {
      periodStartUnix volumeUSD totalValueLockedUSD priceUSD open high low close
    }
  }
`

const POOL_DAY_QUERY = `
  query PoolDayData($pool: String!, $first: Int!) {
    poolDayDatas(first: $first, orderBy: date, orderDirection: desc, where: { pool: $pool }) {
      date volumeUSD tvlUSD token0Price token1Price open high low close
    }
  }
`

const POOL_HOUR_QUERY = `
  query PoolHourData($pool: String!, $first: Int!) {
    poolHourDatas(first: $first, orderBy: periodStartUnix, orderDirection: desc, where: { pool: $pool }) {
      periodStartUnix volumeUSD tvlUSD token0Price token1Price open high low close
    }
  }
`

const POOL_EVENT_FIELDS = `
  id timestamp origin amount0 amount1 amountUSD
  transaction { id }
  token0 { id symbol name decimals }
  token1 { id symbol name decimals }
`

const TRANSACTIONS_QUERY = `
  query PoolTxs($first: Int!, $swapWhere: Swap_filter, $mintWhere: Mint_filter, $burnWhere: Burn_filter) {
    swaps(first: $first, orderBy: timestamp, orderDirection: desc, where: $swapWhere) { ${POOL_EVENT_FIELDS} }
    mints(first: $first, orderBy: timestamp, orderDirection: desc, where: $mintWhere) { ${POOL_EVENT_FIELDS} }
    burns(first: $first, orderBy: timestamp, orderDirection: desc, where: $burnWhere) { ${POOL_EVENT_FIELDS} }
  }
`

const POOL_TICKS_QUERY = `
  query PoolTicks($pool: String!, $skip: Int, $first: Int) {
    ticks(where: { pool: $pool }, skip: $skip, first: $first, orderBy: tickIdx, orderDirection: asc) {
      tickIdx liquidityGross liquidityNet price0 price1
    }
  }
`

// ------------------------------------------------------------------ helpers

/** Resolve chain config + subgraph URL for a gateway `Chain` enum arg, or throw a clear error. */
function requireChain(chainEnum: string): { chain: ChainConfig; url: string } {
  const chain = getChainByEnum(chainEnum)
  if (!chain) {
    throw new Error(`Chain ${chainEnum} is not a HookSwap subgraph-served chain.`)
  }
  const url = resolveSubgraphUrl(chain)
  if (!url) {
    throw new Error(`No SUBGRAPH_URL configured for chain ${chainEnum} (${chain.subgraphEnvVar}).`)
  }
  return { chain, url }
}

/** TokenSortableField (gateway) -> subgraph Token_orderBy field. MARKET_CAP has no circulating-supply
 * source in a v3-subgraph, so it falls back to TVL for ordering only (token values stay real). */
function tokenOrderBy(orderBy: string | undefined): string {
  switch (orderBy) {
    case 'VOLUME':
      return 'volumeUSD'
    case 'POPULARITY':
      return 'txCount'
    case 'MARKET_CAP':
    case 'TOTAL_VALUE_LOCKED':
    default:
      return 'totalValueLockedUSD'
  }
}

// --- token market day/hour series loader (memoized per TokenMarket object) --------------------

async function fetchTokenSeries(
  url: string,
  address: string,
  granularity: 'hour' | 'day',
  points: number,
): Promise<SeriesRow[]> {
  const query = granularity === 'hour' ? TOKEN_HOUR_QUERY : TOKEN_DAY_QUERY
  const listKey = granularity === 'hour' ? 'tokenHourDatas' : 'tokenDayDatas'
  const data = await querySubgraph<Record<string, SgSnapshot[]>>(url, query, { token: address, first: points })
  const rows = (data[listKey] ?? []).map(toSeriesRow)
  rows.sort((a, b) => a.timestamp - b.timestamp) // ascending — charts expect oldest-first
  return rows
}

async function loadTokenSeries(market: GwTokenMarket, duration: string): Promise<SeriesRow[]> {
  if (!market._url) {
    return []
  }
  const { granularity, points } = durationToWindow(duration)
  const key = `${granularity}:${points}`
  let p = market._cache.get(key)
  if (!p) {
    p = fetchTokenSeries(market._url, market._address, granularity, points)
    market._cache.set(key, p)
  }
  return p
}

// --- pool day/hour series loader (memoized per V3Pool object via WeakMap) ---------------------

const poolSeriesCache = new WeakMap<GwV3Pool, Map<string, Promise<SeriesRow[]>>>()

async function fetchPoolSeries(
  url: string,
  address: string,
  granularity: 'hour' | 'day',
  points: number,
): Promise<SeriesRow[]> {
  const query = granularity === 'hour' ? POOL_HOUR_QUERY : POOL_DAY_QUERY
  const listKey = granularity === 'hour' ? 'poolHourDatas' : 'poolDayDatas'
  const data = await querySubgraph<Record<string, SgSnapshot[]>>(url, query, { pool: address, first: points })
  const rows = (data[listKey] ?? []).map(toSeriesRow)
  rows.sort((a, b) => a.timestamp - b.timestamp)
  return rows
}

async function loadPoolSeries(pool: GwV3Pool, duration: string): Promise<SeriesRow[]> {
  if (!pool._url) {
    return []
  }
  const { granularity, points } = durationToWindow(duration)
  const key = `${granularity}:${points}`
  let m = poolSeriesCache.get(pool)
  if (!m) {
    m = new Map()
    poolSeriesCache.set(pool, m)
  }
  let p = m.get(key)
  if (!p) {
    p = fetchPoolSeries(pool._url, pool.address, granularity, points)
    m.set(key, p)
  }
  return p
}

// --- shared transaction fetcher (swaps + mints + burns, merged desc by timestamp) ------------

interface TxOpts {
  pool?: string
  token?: string
  first: number
  timestampCursor?: number | null
}

async function fetchTransactions(url: string, chain: GatewayChain, opts: TxOpts): Promise<GwPoolTransaction[]> {
  const withCursor = (extra: Record<string, unknown>): Record<string, unknown> => {
    const w = { ...extra }
    if (typeof opts.timestampCursor === 'number') {
      w.timestamp_lt = String(opts.timestampCursor)
    }
    return w
  }

  let where: Record<string, unknown>
  if (opts.pool) {
    where = withCursor({ pool: opts.pool })
  } else if (opts.token) {
    where = withCursor({ or: [{ token0: opts.token }, { token1: opts.token }] })
  } else {
    where = withCursor({})
  }

  const data = await querySubgraph<{ swaps: SgPoolEvent[]; mints: SgPoolEvent[]; burns: SgPoolEvent[] }>(
    url,
    TRANSACTIONS_QUERY,
    { first: opts.first, swapWhere: where, mintWhere: where, burnWhere: where },
  )

  const all: GwPoolTransaction[] = [
    ...(data.swaps ?? []).map((e) => toGwPoolTransaction(e, 'SWAP', chain)),
    ...(data.mints ?? []).map((e) => toGwPoolTransaction(e, 'ADD', chain)),
    ...(data.burns ?? []).map((e) => toGwPoolTransaction(e, 'REMOVE', chain)),
  ]
  all.sort((a, b) => b.timestamp - a.timestamp)
  return all.slice(0, opts.first)
}

// ------------------------------------------------------------------ Query resolvers

interface ContractInput {
  chain: string
  address?: string | null
}

export const resolvers = {
  Query: {
    // --- TopV3Pools ------------------------------------------------------
    async topV3Pools(
      _root: unknown,
      args: { chain: string; first: number; tvlCursor?: number | null; tokenFilter?: string | null },
    ): Promise<GwV3Pool[]> {
      const { chain, url } = requireChain(args.chain)

      // Build the subgraph Pool_filter: TVL cursor (pagination) AND optional token membership.
      const where: Record<string, unknown> = {}
      if (typeof args.tvlCursor === 'number') {
        where.totalValueLockedUSD_lt = String(args.tvlCursor)
      }
      if (args.tokenFilter) {
        const t = args.tokenFilter.toLowerCase()
        where.or = [{ token0: t }, { token1: t }]
      }

      const data = await querySubgraph<{ pools: SgPool[] }>(url, TOP_POOLS_QUERY, {
        first: args.first,
        where: Object.keys(where).length > 0 ? where : undefined,
      })
      // TopV3Pools does not select token prices, so bundle is not needed here (pass null).
      return data.pools.map((p) => toGwV3Pool(p, chain.gatewayChain, null, url))
    },

    // --- V3Pool ----------------------------------------------------------
    async v3Pool(_root: unknown, args: { chain: string; address: string }): Promise<GwV3Pool | null> {
      const { chain, url } = requireChain(args.chain)
      const data = await querySubgraph<{ pool: SgPool | null; bundle: SgBundle | null }>(url, POOL_QUERY, {
        id: args.address.toLowerCase(),
      })
      if (!data.pool) {
        return null
      }
      return toGwV3Pool(data.pool, chain.gatewayChain, data.bundle, url)
    },

    // --- FeeTierDistribution (v3PoolsForTokenPair) -----------------------
    async v3PoolsForTokenPair(
      _root: unknown,
      args: { chain: string; token0: string; token1: string },
    ): Promise<GwV3Pool[]> {
      const { chain, url } = requireChain(args.chain)
      const data = await querySubgraph<{ a: SgPool[]; b: SgPool[]; bundle: SgBundle | null }>(
        url,
        POOLS_FOR_PAIR_QUERY,
        { t0: args.token0.toLowerCase(), t1: args.token1.toLowerCase() },
      )
      // token order is either (t0,t1) or (t1,t0); both are the same pair — return the union.
      return [...(data.a ?? []), ...(data.b ?? [])].map((p) => toGwV3Pool(p, chain.gatewayChain, data.bundle, url))
    },

    // --- V3Transactions (chain-wide recent pool transactions) -----------
    async v3Transactions(
      _root: unknown,
      args: { chain: string; first: number; timestampCursor?: number | null },
    ): Promise<GwPoolTransaction[]> {
      const { chain, url } = requireChain(args.chain)
      return fetchTransactions(url, chain.gatewayChain, { first: args.first, timestampCursor: args.timestampCursor })
    },

    // --- TokenSpotPrice / TokenWeb / TokenPrice / charts / Token*Transactions ---
    async token(_root: unknown, args: { chain: string; address?: string | null }): Promise<GwToken | null> {
      const { chain, url } = requireChain(args.chain)
      if (!args.address) {
        // Native token: the subgraph keys by wrapped-native address. Serving native spot price needs
        // the per-chain wrapped-native mapping (see trading-api-adapter/src/chains.ts). TODO.
        return null
      }
      const data = await querySubgraph<{ token: SgToken | null; bundle: SgBundle | null }>(url, TOKEN_QUERY, {
        id: args.address.toLowerCase(),
      })
      if (!data.token) {
        return null
      }
      return toGwToken(data.token, chain.gatewayChain, tokenPriceUSD(data.token, data.bundle), url)
    },

    // --- UniswapPrices / Tokens / HomeScreenTokens ----------------------
    async tokens(_root: unknown, args: { contracts: ContractInput[] }): Promise<Array<GwToken | null>> {
      // Group requested contracts by chain, query each chain's subgraph once, then re-emit in the
      // original request order (interface matches by response id, so order is not load-bearing, but
      // we preserve it for cleanliness).
      const byChain = new Map<string, string[]>()
      for (const c of args.contracts) {
        if (!c.address) {
          continue
        }
        const list = byChain.get(c.chain) ?? []
        list.push(c.address.toLowerCase())
        byChain.set(c.chain, list)
      }

      const found = new Map<string, GwToken>() // key: `${chain}:${address}`
      for (const [chainEnum, ids] of byChain) {
        const chain = getChainByEnum(chainEnum)
        const url = chain ? resolveSubgraphUrl(chain) : undefined
        if (!chain || !url) {
          continue // unconfigured chain -> those entries resolve to null (honest, not fabricated)
        }
        const data = await querySubgraph<{ tokens: SgToken[]; bundle: SgBundle | null }>(url, TOKENS_QUERY, { ids })
        for (const t of data.tokens) {
          found.set(
            `${chain.gatewayChain}:${t.id.toLowerCase()}`,
            toGwToken(t, chain.gatewayChain, tokenPriceUSD(t, data.bundle), url),
          )
        }
      }

      return args.contracts.map((c) => {
        const chain = getChainByEnum(c.chain)
        if (!chain || !c.address) {
          return null
        }
        return found.get(`${chain.gatewayChain}:${c.address.toLowerCase()}`) ?? null
      })
    },

    // --- TopTokens -------------------------------------------------------
    async topTokens(
      _root: unknown,
      args: { chain?: string | null; page?: number | null; pageSize?: number | null; orderBy?: string | null },
    ): Promise<Array<GwToken | null>> {
      const chain = getChainByEnum(args.chain ?? undefined)
      const url = chain ? resolveSubgraphUrl(chain) : undefined
      if (!chain || !url) {
        // Unknown/unconfigured chain -> empty list (honest; interface shows an empty explore table).
        return []
      }
      const pageSize = args.pageSize ?? 100
      const page = args.page ?? 1
      const data = await querySubgraph<{ tokens: SgToken[]; bundle: SgBundle | null }>(url, TOP_TOKENS_QUERY, {
        first: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: tokenOrderBy(args.orderBy ?? undefined),
      })
      return data.tokens.map((t) => toGwToken(t, chain.gatewayChain, tokenPriceUSD(t, data.bundle), url))
    },

    // --- isV3SubgraphStale ----------------------------------------------
    async isV3SubgraphStale(_root: unknown, args: { chain: string }): Promise<boolean | null> {
      const { url } = requireChain(args.chain)
      const data = await querySubgraph<{ _meta: { hasIndexingErrors: boolean } | null }>(url, META_QUERY)
      // "Stale" here == subgraph reported indexing errors. A block-lag comparison could be added if
      // the interface needs a freshness threshold (would require the chain head from an RPC). TODO.
      return data._meta ? Boolean(data._meta.hasIndexingErrors) : null
    },
  },

  // ---------------------------------------------------------------- field resolvers (args)

  V3Pool: {
    cumulativeVolume(parent: GwV3Pool, args: { duration: string }) {
      return poolCumulativeVolume(parent, args.duration)
    },
    totalLiquidityPercentChange24h(parent: GwV3Pool) {
      return poolTvlPercentChange24h(parent)
    },
    async historicalVolume(parent: GwV3Pool, args: { duration: string }) {
      const rows = await loadPoolSeries(parent, args.duration)
      return rows.map((r) => toTimestampedAmount(`pvol:${parent.address}`, r.timestamp, r.volumeUSD))
    },
    async priceHistory(parent: GwV3Pool, args: { duration: string }) {
      const rows = await loadPoolSeries(parent, args.duration)
      return rows.map((r) => ({
        __typename: 'TimestampedPoolPrice' as const,
        id: `TimestampedPoolPrice:${parent.address}:${r.timestamp}`,
        timestamp: r.timestamp,
        token0Price: r.token0Price,
        token1Price: r.token1Price,
      }))
    },
    async transactions(parent: GwV3Pool, args: { first: number; timestampCursor?: number | null }) {
      if (!parent._url) {
        return []
      }
      return fetchTransactions(parent._url, parent.chain, {
        pool: parent.address,
        first: args.first,
        timestampCursor: args.timestampCursor,
      })
    },
    async ticks(parent: GwV3Pool, args: { skip?: number | null; first?: number | null }) {
      if (!parent._url) {
        return []
      }
      const data = await querySubgraph<{ ticks: SgTick[] }>(parent._url, POOL_TICKS_QUERY, {
        pool: parent.address,
        skip: args.skip ?? 0,
        first: args.first ?? 1000,
      })
      return (data.ticks ?? []).map((t) => toGwV3PoolTick(t, parent.address))
    },
  },

  Token: {
    // TokenWeb / TokenMarketParts / tokenCharts: market(currency: USD) { ... }
    market(parent: GwToken): GwTokenMarket {
      return buildTokenMarket(parent)
    },
    // V3TokenTransactions: token(...) { v3Transactions(first, timestampCursor) { ...PoolTx } }
    async v3Transactions(parent: GwToken, args: { first: number; timestampCursor?: number | null }) {
      if (!parent._subgraphUrl) {
        return []
      }
      return fetchTransactions(parent._subgraphUrl, parent.chain, {
        token: parent.address,
        first: args.first,
        timestampCursor: args.timestampCursor,
      })
    },
  },

  TokenMarket: {
    price(parent: GwTokenMarket) {
      return toPriceAmount(`market:${parent._chain}:${parent._address}`, parent._priceUSD)
    },
    totalValueLocked(parent: GwTokenMarket) {
      return parent._tvlUSD === null ? null : toAmount(`mtvl:${parent._chain}:${parent._address}`, parent._tvlUSD)
    },
    fullyDilutedValuation(parent: GwTokenMarket) {
      return parent._fdvUSD === null ? null : toAmount(`fdv:${parent._chain}:${parent._address}`, parent._fdvUSD)
    },
    async volume(parent: GwTokenMarket, args: { duration: string }) {
      const rows = await loadTokenSeries(parent, args.duration)
      return toAmount(`mvol:${args.duration}:${parent._address}`, sumVolume(rows))
    },
    async historicalVolume(parent: GwTokenMarket, args: { duration: string }) {
      const rows = await loadTokenSeries(parent, args.duration)
      return rows.map((r) => toTimestampedAmount(`tvol:${parent._address}`, r.timestamp, r.volumeUSD))
    },
    async historicalTvl(parent: GwTokenMarket, args: { duration: string }) {
      const rows = await loadTokenSeries(parent, args.duration)
      return rows.map((r) => toTimestampedAmount(`ttvl:${parent._address}`, r.timestamp, r.tvlUSD))
    },
    async priceHistory(parent: GwTokenMarket, args: { duration: string }) {
      const rows = await loadTokenSeries(parent, args.duration)
      return rows.map((r) => toTimestampedAmount(`tprice:${parent._address}`, r.timestamp, r.priceUSD || r.close))
    },
    async ohlc(parent: GwTokenMarket, args: { duration: string }) {
      const rows = await loadTokenSeries(parent, args.duration)
      return rows.map((r) => toTimestampedOhlc(`${parent._address}`, r))
    },
    async pricePercentChange(parent: GwTokenMarket, args: { duration: string }) {
      const rows = await loadTokenSeries(parent, args.duration)
      return toAmount(`ppc:${args.duration}:${parent._address}`, pricePercentChange(rows), null)
    },
    async priceHighLow(parent: GwTokenMarket, args: { duration: string; highLow: 'HIGH' | 'LOW' }) {
      const rows = await loadTokenSeries(parent, args.duration)
      const v = priceHighLow(rows, args.highLow)
      return v === null ? null : toAmount(`phl:${args.duration}:${args.highLow}:${parent._address}`, v)
    },
  },

  TokenProject: {
    // TokenSpotPrice / UniswapPrices / TokenProjectMarketsParts: markets(currencies: [USD]) { id price { value } ... }
    // Project-level (cross-chain aggregate) market metrics have no single-subgraph source, so only the
    // USD spot price is emitted; marketCap / FDV / volume / % change / high-low are null here (they ARE
    // served on Token.market from that token's own day/hour snapshots — see TokenMarket above).
    markets(parent: GwTokenProject, _args: { currencies?: string[] }) {
      if (parent._priceUSD === null) {
        return []
      }
      return [
        {
          id: `TokenProjectMarket:${parent.id}`,
          currency: 'USD',
          price: toPriceAmount(`project:${parent.id}`, parent._priceUSD),
          marketCap: null,
          fullyDilutedValuation: null,
          pricePercentChange24h: null,
          volume24h: null,
          priceHigh52w: null,
          priceLow52w: null,
        },
      ]
    },
  },
}
