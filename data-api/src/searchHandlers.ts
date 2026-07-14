/**
 * SearchService.searchTokens handler for the HookSwap data-api.
 *
 * WHY THIS EXISTS: the HookSwap interface's token-selector search normally calls Uniswap's hosted
 * SearchService, which only knows Uniswap's chains — so searching by symbol/name/address on a HookSwap
 * custom chain (e.g. Robinhood 4663) errors. Repointing the interface's search transport at this
 * data-api (see searchTokensAndPools.ts) routes search here instead, and this handler answers it from
 * the SAME real, on-chain token set that listTokens builds:
 *
 *   per requested chain → native + wrapped-native + seeded ERC-20s + tokens discovered in live v2/v3
 *   pools (metadata read on-chain). We then filter by a case-insensitive substring match on
 *   symbol / name / address. For an EXACT address that isn't already in that set, we do a live ERC-20
 *   metadata read (getTokenMeta) so pasting any valid token address resolves it.
 *
 * NO FABRICATED DATA: only real static + on-chain-discovered + on-chain-read tokens are returned;
 * honest empty results ([]) when nothing matches. We populate the legacy flat `tokens[]` shape — the
 * interface's `transformSearchToMultichain` converts it to the multichainTokens shape it consumes.
 */

import type { ServiceImpl } from '@connectrpc/connect'
import { SearchService } from '@uniswap/client-data-api/dist/data/v1/search_connect'
import { SearchTokensRequest, SearchTokensResponse } from '@uniswap/client-data-api/dist/data/v1/search_pb'
import { Token as SearchToken } from '@uniswap/client-data-api/dist/data/v1/searchTypes_pb'
import { getChain, isSupportedChain, supportedChainIds } from './chains'
import { getV2PairsCached, getV3PoolsCached } from './handlers'
import { getTokenMeta, TokenMeta } from './onchain'

/** Hard cap on returned tokens when the request doesn't specify a (sane) size. */
const DEFAULT_SIZE = 50

/** A flat token candidate collected for a chain (native has empty address). */
interface TokenCandidate {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  /** 'ERC20' | 'NATIVE' — the search proto's Token.standard string. */
  standard: 'ERC20' | 'NATIVE'
}

/** Resolve which supported chains a request targets: its chainIds, or all supported if none given. */
function resolveChainIds(requested: number[]): number[] {
  const ids = requested.length ? requested : supportedChainIds()
  return ids.filter(isSupportedChain)
}

/**
 * Collect the real token set for one chain: native + wrapped-native + seeded ERC-20s + tokens
 * discovered in live v2/v3 pools (metadata read on-chain). De-duplicated by lowercased address; the
 * native asset (empty address) is always included once. Same sources as listTokens (handlers.ts),
 * reusing its cached pool getters so search doesn't re-hit the RPC. Never throws (RPC failure on a
 * chain → just its static tokens).
 *
 * Exported so ExploreStatsService.TokenRankings (exploreStatsHandlers.ts) can reuse the EXACT same
 * real, on-chain-derived token set as searchTokens/listTokens (identity-only — no price/USD needed).
 */
export async function collectChainTokens(chainId: number): Promise<TokenCandidate[]> {
  const chain = getChain(chainId)
  if (!chain) {
    return []
  }
  const out: TokenCandidate[] = []
  const seen = new Set<string>()

  // Native (no contract address).
  out.push({
    chainId,
    address: '',
    symbol: chain.nativeSymbol,
    name: chain.nativeSymbol,
    decimals: chain.nativeDecimals,
    standard: 'NATIVE',
  })

  const pushErc20 = (meta: Pick<TokenMeta, 'address' | 'symbol' | 'name' | 'decimals'>): void => {
    const key = meta.address.toLowerCase()
    if (!key || seen.has(key)) {
      return
    }
    seen.add(key)
    out.push({
      chainId,
      address: meta.address,
      symbol: meta.symbol,
      name: meta.name,
      decimals: meta.decimals,
      standard: 'ERC20',
    })
  }

  // Wrapped-native + seeded tokens (static, verified).
  pushErc20(chain.wrappedNative)
  for (const t of chain.seededTokens ?? []) {
    pushErc20(t)
  }

  // Tokens discovered in live v2 pools.
  try {
    for (const p of await getV2PairsCached(chainId)) {
      pushErc20(p.token0)
      pushErc20(p.token1)
    }
  } catch {
    // RPC down for this chain — keep the static tokens already collected.
  }

  // Tokens discovered in live v3 pools.
  try {
    for (const p of await getV3PoolsCached(chainId)) {
      pushErc20(p.token0)
      pushErc20(p.token1)
    }
  } catch {
    // Non-fatal — static + v2 tokens still returned.
  }

  return out
}

function toSearchToken(c: TokenCandidate): SearchToken {
  return new SearchToken({
    // Deterministic id; the interface uses it as the MultichainToken id (not a data join key).
    tokenId: c.address ? `${c.chainId}-${c.address.toLowerCase()}` : `${c.chainId}-native`,
    chainId: c.chainId,
    address: c.address,
    decimals: c.decimals,
    symbol: c.symbol,
    name: c.name,
    standard: c.standard,
    // logoUrl / safetyLevel / feeData intentionally unset — no registry/oracle on these chains.
    // The interface renders honest defaults (no logo, NonDefault safety) rather than fabricated data.
  })
}

/** Case-insensitive substring match on symbol / name / address. Empty query matches everything. */
function matchesQuery(c: TokenCandidate, q: string): boolean {
  if (!q) {
    return true
  }
  const needle = q.toLowerCase()
  return (
    c.symbol.toLowerCase().includes(needle) ||
    c.name.toLowerCase().includes(needle) ||
    c.address.toLowerCase().includes(needle)
  )
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

export async function handleSearchTokens(req: SearchTokensRequest): Promise<SearchTokensResponse> {
  const chainIds = resolveChainIds(req.chainIds)
  const query = (req.searchQuery ?? '').trim()
  const size = req.size && req.size > 0 ? req.size : DEFAULT_SIZE

  // Collect + filter each chain's real token set.
  const perChain = await Promise.all(
    chainIds.map(async (chainId) => {
      const candidates = await collectChainTokens(chainId)
      return candidates.filter((c) => matchesQuery(c, query))
    }),
  )
  const matches: TokenCandidate[] = perChain.flat()

  // Exact-address fallback: if the query is a bare address that matched nothing in the known set on a
  // given chain, do a live ERC-20 metadata read so any valid token address resolves. getTokenMeta
  // returns best-effort metadata (symbol/name '' + decimals 18 on a non-conforming contract); we only
  // surface it when it actually looks like a token (has a symbol or non-default name).
  if (ADDRESS_RE.test(query)) {
    const already = new Set(matches.map((m) => `${m.chainId}:${m.address.toLowerCase()}`))
    await Promise.all(
      chainIds.map(async (chainId) => {
        if (already.has(`${chainId}:${query.toLowerCase()}`)) {
          return
        }
        try {
          const meta = await getTokenMeta(chainId, query)
          if (meta.symbol || meta.name) {
            matches.push({
              chainId,
              address: meta.address,
              symbol: meta.symbol,
              name: meta.name,
              decimals: meta.decimals,
              standard: 'ERC20',
            })
          }
        } catch {
          // Not a readable ERC-20 on this chain — honest omission, never fabricated.
        }
      }),
    )
  }

  const tokens = matches.slice(0, size).map(toSearchToken)
  return new SearchTokensResponse({ tokens, pools: [], auctions: [], multichainTokens: [] })
}

export function createSearchApiImpl(): ServiceImpl<typeof SearchService> {
  return {
    searchTokens: (req: SearchTokensRequest) => handleSearchTokens(req),
  }
}
