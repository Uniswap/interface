import { unwrapToken } from 'graphql/data/util'
import { useMemo } from 'react'
import { useTrendingTokensQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'

export default function useTrendingTokens(chainId?: UniverseChainId) {
  const { defaultChainId } = useEnabledChains()
  const chain = toGraphQLChain(chainId ?? defaultChainId)
  const { data, loading } = useTrendingTokensQuery({ variables: { chain } })

  return useMemo(
    () => ({ data: data?.topTokens?.map((token) => unwrapToken(chainId ?? 1, token)), loading }),
    [chainId, data?.topTokens, loading],
  )
}
