import { TokenRankingsResponse, TokenRankingsStat } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { normalizeCurrencyIdForMapLookup, normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyId } from 'uniswap/src/types/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

export type FavoritesCanonicalLookup = {
  /** Maps `${chainId}-${normalizedAddress}` → canonical CurrencyId (mainnet when multichain). */
  canonicalByKey: Map<string, CurrencyId>
  /** Maps `${chainId}-${normalizedAddress}` → number of chains the token exists on. */
  networkCountByKey: Map<string, number>
}

/**
 * Key used to look up a token in `FavoritesCanonicalLookup` maps. The `chainId` prefix avoids
 * collisions between native tokens on different chains that share the 0xeeee... placeholder.
 */
export function buildLookupKey({ chainId, address }: { chainId: number; address: string }): string {
  return `${chainId}-${normalizeTokenAddressForCache(address)}`
}

/** Flattens and dedupes tokens across TokenRankings categories (e.g. VOLUME, POPULARITY). */
function mergeTokensAcrossCategories(data: TokenRankingsResponse): TokenRankingsStat[] {
  const seen = new Set<string>()
  const result: TokenRankingsStat[] = []
  for (const category of Object.values(data.tokenRankings)) {
    for (const token of category.tokens) {
      const key = `${token.chain}-${normalizeTokenAddressForCache(token.address)}`
      if (!seen.has(key)) {
        seen.add(key)
        result.push(token)
      }
    }
  }
  return result
}

/**
 * Builds canonical + network-count lookup maps from a TokenRankings response.
 *
 * When the response comes from `{ chainId: ALL_NETWORKS_ARG, multichain: true }`, the output is
 * stable regardless of any Explore network filter. This enables two favorite-token behaviors:
 *  - `canonicalByKey` gives every chain-specific token the same canonical CurrencyId, preventing
 *    duplicate favorites for the same project across chains.
 *  - `networkCountByKey` lets us decide whether to hide the chain badge on a favorite card
 *    consistently (badge is hidden when a token exists on more than one chain).
 *
 * Tokens not represented in the response are intentionally absent from both maps; callers should
 * fall back gracefully (e.g. use the input currencyId as-is, show the chain badge).
 */
export function buildFavoritesCanonicalLookup(data: TokenRankingsResponse | undefined): FavoritesCanonicalLookup {
  const canonicalByKey = new Map<string, CurrencyId>()
  const networkCountByKey = new Map<string, number>()

  if (!data) {
    return { canonicalByKey, networkCountByKey }
  }

  for (const stat of mergeTokensAcrossCategories(data)) {
    const canonicalChainId = fromGraphQLChain(stat.chain)
    const canonicalChainToken = canonicalChainId
      ? // oxlint-disable-next-line typescript/no-unnecessary-condition -- chainTokens can be undefined at runtime despite protobuf typing
        stat.chainTokens?.find((ct) => ct.chainId === canonicalChainId)
      : undefined
    const rawAddress = canonicalChainToken?.address || stat.address
    const canonicalAddress = rawAddress || (canonicalChainId ? getNativeAddress(canonicalChainId) : undefined)

    if (!canonicalChainId || !canonicalAddress) {
      continue
    }

    // Always emit a normalized canonical CurrencyId so downstream equality checks work regardless
    // of the case returned by the backend.
    const canonicalCurrencyId = normalizeCurrencyIdForMapLookup(buildCurrencyId(canonicalChainId, canonicalAddress))
    // oxlint-disable-next-line typescript/no-unnecessary-condition -- chainTokens can be undefined at runtime despite protobuf typing
    const chainTokens = stat.chainTokens ?? []
    const networkCount = chainTokens.length

    for (const ct of chainTokens) {
      const addr = ct.address || getNativeAddress(ct.chainId)
      if (!addr) {
        continue
      }
      const key = buildLookupKey({ chainId: ct.chainId, address: addr })
      canonicalByKey.set(key, canonicalCurrencyId)
      networkCountByKey.set(key, networkCount)
    }

    // Also map the top-level canonical address so lookups work when chainTokens is missing entries.
    const canonicalKey = buildLookupKey({ chainId: canonicalChainId, address: canonicalAddress })
    canonicalByKey.set(canonicalKey, canonicalCurrencyId)
  }

  return { canonicalByKey, networkCountByKey }
}
