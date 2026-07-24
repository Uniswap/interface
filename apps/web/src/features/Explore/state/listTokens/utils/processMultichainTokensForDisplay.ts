import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { TokenSortMethod } from '~/components/Tokens/constants'
import type { UseListTokensOptions } from '~/features/Explore/state/listTokens/types'
import { buildTokenSortRankFromMultichain } from '~/features/Explore/state/listTokens/utils/buildTokenSortRankFromMultichain'
import { filterMultichainTokensBySearchString } from '~/features/Explore/state/listTokens/utils/filterMultichainTokensBySearchString'

function sortMultichainTokensByPrice(tokens: RankedMultichainToken[], sortAscending: boolean): RankedMultichainToken[] {
  const sorted = [...tokens].sort((a, b) => {
    const priceA = a.multichainToken?.price?.spotUsd ?? 0
    const priceB = b.multichainToken?.price?.spotUsd ?? 0
    return priceB - priceA
  })
  return sortAscending ? sorted.reverse() : sorted
}

/** Client-side sort only (PRICE); otherwise API / legacy order is kept. */
function sortTokensForDisplay(
  tokens: RankedMultichainToken[],
  options: Required<UseListTokensOptions>,
): RankedMultichainToken[] {
  if (options.sortMethod === TokenSortMethod.PRICE) {
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
 * 1) Sort — client PRICE sort when `sortMethod === PRICE`, else incoming order.
 * 2) Rank — `tokenSortRank` from that sorted list.
 * 3) Filter — search on the sorted list (`filterString`).
 *
 * - Legacy path: hook does non-PRICE sort only; PRICE sort + filter are done here, then caller slices.
 * - Backend path: BE sorts except for PRICE; we apply client-side price sort here when sortMethod is PRICE.
 */
export function processMultichainTokensForDisplay(
  tokens: RankedMultichainToken[],
  options: Required<UseListTokensOptions>,
): ProcessMultichainTokensForDisplayResult {
  const sorted = sortTokensForDisplay(tokens, options)
  const tokenSortRank = buildTokenSortRankFromMultichain(sorted)
  const topTokens = filterMultichainTokensBySearchString(sorted, options.filterString)
  return { topTokens, tokenSortRank }
}
