import { SupportedInterfaceChainId, chainIdToBackendChain } from 'constants/chains'
import { useMemo } from 'react'
import { useTrendingTokensQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { unwrapToken } from './util'

export default function useTrendingTokens(chainId?: SupportedInterfaceChainId) {
  const chain = chainIdToBackendChain({ chainId, withFallback: true })
  const { data, loading } = useTrendingTokensQuery({ variables: { chain } })

  return useMemo(
    () => ({ data: data?.topTokens?.map((token) => unwrapToken(chainId ?? 1, token)), loading }),
    [chainId, data?.topTokens, loading]
  )
}
