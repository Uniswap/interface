import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export function useExistingTokenProjectMetadata(currencyInfo: Maybe<CurrencyInfo>): {
  description: string
  websiteLink: string
  xHandle: string
  loading: boolean
} {
  const currency = currencyInfo?.currency
  const tokenChainId = currency?.isToken ? currency.chainId : undefined
  const tokenAddress = currency?.isToken ? currency.address : undefined
  const skip = tokenChainId === undefined || tokenAddress === undefined

  const { data, loading } = GraphQLApi.useTokenProjectWebQuery({
    variables: {
      chain: toGraphQLChain(tokenChainId ?? UniverseChainId.Mainnet),
      address: tokenAddress ?? '',
    },
    skip,
  })

  const project = data?.token?.project

  const description = project?.description ?? ''
  const websiteLink = project?.homepageUrl ?? ''
  const xHandle = project?.twitterName ?? ''
  const isLoading = loading && !skip

  return useMemo(
    () => ({
      description,
      websiteLink,
      xHandle,
      loading: isLoading,
    }),
    [description, websiteLink, xHandle, isLoading],
  )
}
