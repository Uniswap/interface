import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'

/**
 * Builds a rank map from multichain tokens (multichainId -> 1-based rank).
 * Only top-level rows get a rank; expanded chain tokens inside a row do not get rank numbers.
 */
export function buildTokenSortRankFromMultichain(tokens: MultichainToken[]): Record<string, number> {
  // oxlint-disable-next-line max-params -- standard reduce callback signature
  return tokens.reduce<Record<string, number>>((acc, token, i) => {
    if (token.multichainId) {
      acc[token.multichainId] = i + 1
    }
    return acc
  }, {})
}
