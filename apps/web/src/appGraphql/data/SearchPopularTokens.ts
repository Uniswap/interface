import { unwrapToken } from 'appGraphql/data/util'
import { useMemo } from 'react'
import { useSearchPopularTokensWebQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'

export default function useSearchPopularTokensGql() {
  const { defaultChainId } = useEnabledChains()
  const chain = toGraphQLChain(defaultChainId)
  const { data, loading } = useSearchPopularTokensWebQuery({ variables: { chain } })

  return useMemo(
    () => ({ data: data?.topTokens?.map((token) => unwrapToken(defaultChainId, token)), loading }),
    [defaultChainId, data?.topTokens, loading],
  )
}
