import {
  useTokenBasicInfoPartsFragment as useTokenBasicInfoPartsFragmentFromApi,
  useTokenBasicProjectPartsFragment as useTokenBasicProjectPartsFragmentFromApi,
  useTokenMarketPartsFragment as useTokenMarketPartsFragmentFromApi,
  useTokenProjectMarketsPartsFragment as useTokenProjectMarketsPartsFragmentFromApi,
  useTokenProjectTokensTvlPartsFragment as useTokenProjectTokensTvlPartsFragmentFromApi,
  useTokenProjectUrlsPartsFragment as useTokenProjectUrlsPartsFragmentFromApi,
} from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { currencyIdToChain, currencyIdToGraphQLAddress } from 'uniswap/src/utils/currencyId'

function currencyIdToGraphQLTokenVariables(currencyId: string): {
  // The GraphQL `address` is `null` for native ETH
  address: string | null
  chain: string
} {
  const chainId = currencyIdToChain(currencyId)

  if (!chainId) {
    // Return variables that won't match any cache entry. Fragment hooks
    // return empty data on cache miss — no throw needed.
    return { address: null, chain: '' }
  }

  return {
    address: currencyIdToGraphQLAddress(currencyId),
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
  preferProjectMarketData = false,
}: {
  currencyId: string
  preferProjectMarketData?: boolean
}): ReturnType<typeof useTokenMarketPartsFragmentFromApi> {
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  // '' resolves to an unmatchable cache key (see currencyIdToGraphQLTokenVariables) once V2 REST is the source of truth.
  return useTokenMarketPartsFragmentFromApi(
    currencyIdToGraphQLTokenVariables(isV2TokensEnabled && !preferProjectMarketData ? '' : currencyId),
  )
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
  preferProjectMarketData = false,
}: {
  currencyId: string
  preferProjectMarketData?: boolean
}): ReturnType<typeof useTokenProjectMarketsPartsFragmentFromApi> {
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  // '' resolves to an unmatchable cache key (see currencyIdToGraphQLTokenVariables) once V2 REST is the source of truth.
  return useTokenProjectMarketsPartsFragmentFromApi(
    currencyIdToGraphQLTokenVariables(isV2TokensEnabled && !preferProjectMarketData ? '' : currencyId),
  )
}

export function useTokenProjectTokensTvlPartsFragment({
  currencyId,
}: {
  currencyId: string
}): ReturnType<typeof useTokenProjectTokensTvlPartsFragmentFromApi> {
  return useTokenProjectTokensTvlPartsFragmentFromApi(currencyIdToGraphQLTokenVariables(currencyId))
}
