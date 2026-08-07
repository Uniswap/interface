import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { multichainTokenKey } from '~/features/Explore/state/listTokens/utils/multichainTokenKey'

/**
 * Builds a rank map from ranked multichain tokens (multichainTokenKey -> 1-based rank).
 * Only top-level rows get a rank; expanded chain tokens inside a row do not get rank numbers.
 * Keyed by multichainTokenKey (not raw multichainId): ungrouped tokens all share the
 * `''` sentinel and would otherwise collide, leaving their rank cells blank.
 */
export function buildTokenSortRankFromMultichain(tokens: RankedMultichainToken[]): Record<string, number> {
  // oxlint-disable-next-line max-params -- standard reduce callback signature
  return tokens.reduce<Record<string, number>>((acc, token, i) => {
    acc[multichainTokenKey(token)] = i + 1
    return acc
  }, {})
}
