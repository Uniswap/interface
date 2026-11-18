import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { UniverseChainId } from '@universe/chains'
import { multichainTokenKey } from '@universe/data-api'
import { buildTokenSortRankFromMultichain } from '~/features/Explore/state/listTokens/utils/buildTokenSortRankFromMultichain'
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

export type ProcessMultichainTokensForDisplayParams = {
  tokens: RankedMultichainToken[]
  /** Feature-flagged chain ids; a token with no addresses leg in this list renders no row. */
  allowedChainIds: readonly UniverseChainId[]
}

type ProcessMultichainTokensForDisplayResult = {
  topTokens: RankedMultichainToken[]
  /** multichainId → 1-based rank in backend order. */
  tokenSortRank: Record<string, number>
}

/**
 * 1) Dedupe — drop repeat multichainIds (can happen across pages of the same fetch).
 * 2) Drop unsupported — tokens whose registry/flag-filtered network set is empty render no row.
 * 3) Rank — `tokenSortRank` from the incoming (backend) order.
 *
 * Ordering and search are never touched: the BE is the source of truth for both (the request
 * carries `sort` and `filter.searchQuery`), so rows display in the order they arrive. Re-filtering
 * here would drop served rows — the BE prefix-matches any multichain member, whose symbol can
 * differ from the group's.
 */
export function processMultichainTokensForDisplay({
  tokens,
  allowedChainIds,
}: ProcessMultichainTokensForDisplayParams): ProcessMultichainTokensForDisplayResult {
  const deduped = dedupeByMultichainId(tokens)
  // Impossible for well-formed data (the FE only requests enabled chains, so a ranked token must
  // have at least one enabled leg): defensive hide of inconsistent rows that would read
  // "0 networks" with no icons or TDP link. Runs before ranking so numbering stays contiguous.
  const supported = deduped.filter((token) => getAllowedAddressChainIds(token, allowedChainIds).size > 0)
  const tokenSortRank = buildTokenSortRankFromMultichain(supported)
  return { topTokens: supported, tokenSortRank }
}
