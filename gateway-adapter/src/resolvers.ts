/**
 * GraphQL resolvers wiring the interface's gateway operations to the v3-subgraph.
 *
 * Only the SUBGRAPH-SERVEABLE operations are implemented here. Everything else is handled by the
 * upstream proxy in server.ts (a request is proxied whenever ANY selected root field is not in
 * `LOCAL_QUERY_FIELDS` below). So adding a new subgraph-backed op = implement its Query resolver
 * here AND add its field name to `LOCAL_QUERY_FIELDS`.
 *
 * Reference operations implemented (see README "resolver coverage"):
 *   - Query.topV3Pools        (TopV3Pools)
 *   - Query.v3Pool            (V3Pool)
 *   - Query.token             (TokenSpotPrice)
 *   - Query.tokens            (UniswapPrices)
 *   - Query.isV3SubgraphStale  (bonus; trivial `_meta` probe)
 */

import { getChainByEnum, resolveSubgraphUrl, type ChainConfig } from './chains'
import { querySubgraph } from './subgraphClient'
import {
  poolCumulativeVolume,
  toGwToken,
  toGwV3Pool,
  toPriceAmount,
  tokenPriceUSD,
  type GwToken,
  type GwTokenProject,
  type GwV3Pool,
  type SgBundle,
  type SgPool,
  type SgToken,
} from './translate'

/**
 * Root Query fields this adapter serves from the subgraph. A GraphQL request is executed locally
 * ONLY if every one of its selected root fields is in this set; otherwise it is proxied upstream.
 * Keep this in sync with the resolvers defined below.
 */
export const LOCAL_QUERY_FIELDS: ReadonlySet<string> = new Set<string>([
  'topV3Pools',
  'v3Pool',
  'token',
  'tokens',
  'isV3SubgraphStale',
])

// ------------------------------------------------------------------ subgraph query documents

const POOL_FIELDS = `
  id
  feeTier
  liquidity
  sqrtPrice
  tick
  token0 { id symbol name decimals derivedETH }
  token1 { id symbol name decimals derivedETH }
  token0Price
  token1Price
  volumeUSD
  txCount
  totalValueLockedUSD
  totalValueLockedToken0
  totalValueLockedToken1
  poolDayData(first: 30, orderBy: date, orderDirection: desc) { date volumeUSD }
`

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

const TOKEN_QUERY = `
  query TokenById($id: ID!) {
    token(id: $id) { id symbol name decimals derivedETH volumeUSD totalValueLockedUSD }
    bundle(id: "1") { ethPriceUSD }
  }
`

const TOKENS_QUERY = `
  query TokensByIds($ids: [ID!]!) {
    tokens(where: { id_in: $ids }) { id symbol name decimals derivedETH volumeUSD totalValueLockedUSD }
    bundle(id: "1") { ethPriceUSD }
  }
`

const META_QUERY = `
  query Meta {
    _meta { hasIndexingErrors block { number } }
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
      return data.pools.map((p) => toGwV3Pool(p, chain.gatewayChain, null))
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
      return toGwV3Pool(data.pool, chain.gatewayChain, data.bundle)
    },

    // --- TokenSpotPrice --------------------------------------------------
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
      return toGwToken(data.token, chain.gatewayChain, tokenPriceUSD(data.token, data.bundle))
    },

    // --- UniswapPrices ---------------------------------------------------
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
          found.set(`${chain.gatewayChain}:${t.id.toLowerCase()}`, toGwToken(t, chain.gatewayChain, tokenPriceUSD(t, data.bundle)))
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
  },

  Token: {
    // TokenPrice fragment: market(currency: USD) { id price { id value } }
    market(parent: GwToken, _args: { currency?: string }) {
      if (parent._priceUSD === null) {
        return null
      }
      return {
        id: `TokenMarket:${parent.chain}:${parent.address}`,
        token: parent,
        priceSource: 'SUBGRAPH_V3',
        price: toPriceAmount(`market:${parent.chain}:${parent.address}`, parent._priceUSD),
      }
    },
  },

  TokenProject: {
    // TokenProjectMarketsParts / TokenSpotPrice: markets(currencies: [USD]) { id price { value } ... }
    markets(parent: GwTokenProject, _args: { currencies?: string[] }) {
      if (parent._priceUSD === null) {
        return []
      }
      return [
        {
          id: `TokenProjectMarket:${parent.id}`,
          currency: 'USD',
          price: toPriceAmount(`project:${parent.id}`, parent._priceUSD),
          // marketCap / FDV / volume / pricePercentChange have no honest subgraph source here -> null.
          marketCap: null,
          fullyDilutedValuation: null,
          pricePercentChange24h: null,
        },
      ]
    },
  },
}
