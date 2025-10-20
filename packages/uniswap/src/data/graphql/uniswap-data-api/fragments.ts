import {
  useTokenBasicInfoPartsFragment as useTokenBasicInfoPartsFragmentFromApi,
  useTokenBasicProjectPartsFragment as useTokenBasicProjectPartsFragmentFromApi,
  useTokenMarketPartsFragment as useTokenMarketPartsFragmentFromApi,
  useTokenProjectMarketsPartsFragment as useTokenProjectMarketsPartsFragmentFromApi,
  useTokenProjectUrlsPartsFragment as useTokenProjectUrlsPartsFragmentFromApi,
} from '@universe/api'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { currencyIdToChain, currencyIdToGraphQLAddress } from 'uniswap/src/utils/currencyId'

function currencyIdToGraphQLTokenVariables(currencyId: string): {
  // The GraphQL `address` is `null` for native ETH
  address: string | null
  chain: string
} {
  const chainId = currencyIdToChain(currencyId)
  const address = currencyIdToGraphQLAddress(currencyId)

  if (!chainId) {
    throw new Error(`Unable to find chainId for currencyId: ${currencyId}`)
  }

  return {
    address,
    chain: toGraphQLChain(chainId),
  }
}

export function useTokenBasicInfoPartsFragment({
  currencyId,
}: {
  currencyId: string
}): ReturnType<typeof useTokenBasicInfoPartsFragmentFromApi> {
  return useTokenBasicInfoPartsFragmentFromApi(currencyIdToGraphQLTokenVariables(currencyId))
}

export function useTokenMarketPartsFragment({
  currencyId,
}: {
  currencyId: string
}): ReturnType<typeof useTokenMarketPartsFragmentFromApi> {
  return useTokenMarketPartsFragmentFromApi(currencyIdToGraphQLTokenVariables(currencyId))
}

export function useTokenBasicProjectPartsFragment({
  currencyId,
}: {
  currencyId: string
}): ReturnType<typeof useTokenBasicProjectPartsFragmentFromApi> {
  return useTokenBasicProjectPartsFragmentFromApi(currencyIdToGraphQLTokenVariables(currencyId))
}

export function useTokenProjectUrlsPartsFragment({
  currencyId,
}: {
  currencyId: string
}): ReturnType<typeof useTokenProjectUrlsPartsFragmentFromApi> {
  return useTokenProjectUrlsPartsFragmentFromApi(currencyIdToGraphQLTokenVariables(currencyId))
}

export function useTokenProjectMarketsPartsFragment({
  currencyId,
}: {
  currencyId: string
}): ReturnType<typeof useTokenProjectMarketsPartsFragmentFromApi> {
  return useTokenProjectMarketsPartsFragmentFromApi(currencyIdToGraphQLTokenVariables(currencyId))
}
