import { useMemo } from 'react'
import {
  SearchTokensWebQuery,
  Token,
  useSearchTokensWebQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { isBackendSupportedChain } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

// Filters out results that are undefined, or where the token's chain is not supported in explore.
function isExploreSupportedToken(token: GqlSearchToken | undefined): token is Token {
  return token !== undefined && isBackendSupportedChain(token.chain)
}

export function useSearchTokens(searchQuery: string = '') {
  const { gqlChains: chains } = useEnabledChains()
  const searchRevampEnabled = useFeatureFlag(FeatureFlags.SearchRevamp)

  const { data, loading, error } = useSearchTokensWebQuery({
    variables: { searchQuery, chains },
    skip: searchQuery === '' || searchRevampEnabled, // if search revamp is enabled, we call useSearchTokens in `SearchModalResultsList` instead
  })

  return useMemo(() => {
    const sortedTokens = data?.searchTokens?.filter(isExploreSupportedToken) ?? []
    return { data: sortedTokens, loading, error }
  }, [data?.searchTokens, loading, error])
}

export type GqlSearchToken = NonNullable<NonNullable<SearchTokensWebQuery['searchTokens']>[number]>
