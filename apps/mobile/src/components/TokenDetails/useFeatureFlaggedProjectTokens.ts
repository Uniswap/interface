import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { useFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'

/**
 * Filters a token project's on-chain deployments down to feature-flag-enabled chains, so unlaunched
 * gated chains (e.g. Arc/Robinhood) don't surface in the mobile TDP multichain UI — header multichain
 * state, the market-data Networks row, cross-chain balances, and the address/explorer sheets.
 *
 * Accepts the loosely-typed GraphQL fragment shape (elements may be undefined, `chain` may be absent)
 * and preserves the element type so callers keep fields like `address`.
 */
export function useFeatureFlaggedProjectTokens<T extends { chain?: GraphQLApi.Chain | null }>(
  tokens: readonly (T | null | undefined)[] | null | undefined,
): T[] {
  const featureFlaggedChainIds = useFeatureFlaggedChainIds()
  return useMemo(() => {
    const result: T[] = []
    for (const token of tokens ?? []) {
      if (!token) {
        continue
      }
      const chainId = fromGraphQLChain(token.chain ?? undefined)
      if (chainId !== null && featureFlaggedChainIds.includes(chainId)) {
        result.push(token)
      }
    }
    return result
  }, [tokens, featureFlaggedChainIds])
}
