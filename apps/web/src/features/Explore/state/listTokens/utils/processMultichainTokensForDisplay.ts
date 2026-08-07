import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TokenSortMethod } from '~/components/Tokens/constants'
import type { UseListTokensOptions } from '~/features/Explore/state/listTokens/types'
import { buildTokenSortRankFromMultichain } from '~/features/Explore/state/listTokens/utils/buildTokenSortRankFromMultichain'
import { filterMultichainTokensBySearchString } from '~/features/Explore/state/listTokens/utils/filterMultichainTokensBySearchString'
import { multichainTokenKey } from '~/features/Explore/state/listTokens/utils/multichainTokenKey'
import { getAllowedAddressChainIds } from '~/features/Explore/state/listTokens/utils/multichainVolume'

// BE should be grouping multichain assets already, this is a defensive guard.
// Keyed by multichainTokenKey so ungrouped tokens (multichainId `''`) dedupe on
// their unique (chainId, address) instead of all colliding on the sentinel.
function dedupeByMultichainId(tokens: RankedMultichainToken[]): RankedMultichainToken[] {
  const seen = new Set<string>()
  return tokens.filter((token) => {
    const key = multichainTokenKey(token)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function sortMultichainTokensByPrice(tokens: RankedMultichainToken[], sortAscending: boolean): RankedMultichainToken[] {
  const sorted = [...tokens].sort((a, b) => {
    const priceA = a.multichainToken?.price?.spotUsd ?? 0
    const priceB = b.multichainToken?.price?.spotUsd ?? 0
    return priceB - priceA
  })
  return sortAscending ? sorted.reverse() : sorted
}

export type ProcessMultichainTokensForDisplayParams = {
  tokens: RankedMultichainToken[]
  options: Required<UseListTokensOptions>
  /** When true, the backend is the source of truth for ordering, so skip client-side PRICE sort. */
  trustBackendOrder: boolean
  /** Feature-flagged chain ids; a token with no addresses leg in this list renders no row. */
  allowedChainIds: readonly UniverseChainId[]
}

// V2 sorts on the BE so we can skip client-side sorting
function sortTokensForDisplay({
  tokens,
  options,
  trustBackendOrder,
}: Omit<ProcessMultichainTokensForDisplayParams, 'allowedChainIds'>): RankedMultichainToken[] {
  if (options.sortMethod === TokenSortMethod.PRICE && !trustBackendOrder) {
    return sortMultichainTokensByPrice(tokens, options.sortAscending)
  }
  return tokens
}

type ProcessMultichainTokensForDisplayResult = {
  topTokens: RankedMultichainToken[]
  /** multichainId → 1-based rank after client sort, before search filter. */
  tokenSortRank: Record<string, number>
}

/**
 * 1) Dedupe — drop repeat multichainIds (can happen across pages of the same fetch).
 * 2) Drop unsupported — tokens whose registry/flag-filtered network set is empty render no row.
 * 3) Sort — client PRICE sort when `sortMethod === PRICE` and `trustBackendOrder` is false, else
 *    incoming order.
 * 4) Rank — `tokenSortRank` from that sorted list.
 * 5) Filter — search on the sorted list (`filterString`).
 *
 * - Legacy path (`trustBackendOrder: false`): hook does non-PRICE sort only; PRICE sort + filter
 *   are done here, then caller slices.
 * - Backend path (`trustBackendOrder: true`): BE is the source of truth for ordering (PRICE
 *   support is landing there too), so we never re-sort client-side and just display its order.
 */
export function processMultichainTokensForDisplay({
  tokens,
  options,
  trustBackendOrder,
  allowedChainIds,
}: ProcessMultichainTokensForDisplayParams): ProcessMultichainTokensForDisplayResult {
  const deduped = dedupeByMultichainId(tokens)
  // Impossible for well-formed data (the FE only requests enabled chains, so a ranked token must
  // have at least one enabled leg): defensive hide of inconsistent rows that would read
  // "0 networks" with no icons or TDP link. Runs before ranking so numbering stays contiguous.
  const supported = deduped.filter((token) => getAllowedAddressChainIds(token, allowedChainIds).size > 0)
  const sorted = sortTokensForDisplay({ tokens: supported, options, trustBackendOrder })
  const tokenSortRank = buildTokenSortRankFromMultichain(sorted)
  const topTokens = filterMultichainTokensBySearchString(sorted, options.filterString)
  return { topTokens, tokenSortRank }
}
