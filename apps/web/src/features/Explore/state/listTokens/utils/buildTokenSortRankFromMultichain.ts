import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'

/**
 * Builds a rank map from ranked multichain tokens (multichainId -> 1-based rank).
 * Only top-level rows get a rank; expanded chain tokens inside a row do not get rank numbers.
 */
export function buildTokenSortRankFromMultichain(tokens: RankedMultichainToken[]): Record<string, number> {
  // oxlint-disable-next-line max-params -- standard reduce callback signature
  return tokens.reduce<Record<string, number>>((acc, token, i) => {
    const multichainId = token.multichainToken?.multichainId
    if (multichainId) {
      acc[multichainId] = i + 1
    }
    return acc
  }, {})
}
