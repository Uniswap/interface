import { useQuery } from '@tanstack/react-query'
import { GqlResult, GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { getCommonBase } from 'uniswap/src/constants/routing'
import {
  getGetTokenQueryOptions,
  getGetTokensQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  currencyIdToContractInput,
  currencyIdToRestContractInput,
} from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { gqlTokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils/gqlTokenToCurrencyInfo'
import { restV2TokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils/restV2TokenToCurrencyInfo'
import {
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
} from 'uniswap/src/utils/currencyId'

function useCurrencyInfoQuery(
  _currencyId?: string,
  options?: { refetch?: boolean; skip?: boolean },
): { currencyInfo: Maybe<CurrencyInfo>; loading: boolean; error?: Error } {
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)

  const restParams = useMemo(
    () => (_currencyId ? currencyIdToRestContractInput(_currencyId) : undefined),
    [_currencyId],
  )
  const restQueryResult = useQuery(
    getGetTokenQueryOptions({
      params: restParams,
      enabled: isV2TokensEnabled && !!restParams && !options?.skip,
    }),
  )

  const gqlQueryResult = GraphQLApi.useTokenQuery({
    variables: currencyIdToContractInput(_currencyId ?? ''),
    skip: !_currencyId || options?.skip || isV2TokensEnabled,
    fetchPolicy: options?.refetch ? 'cache-and-network' : 'cache-first',
  })

  const currencyInfo = useMemo(() => {
    if (!_currencyId) {
      return undefined
    }

    const chainId = currencyIdToChain(_currencyId)
    let address: Address | undefined
    try {
      address = currencyIdToAddress(_currencyId)
    } catch (_error) {
      return undefined
    }

    const restToken = restQueryResult.data?.token
    const gqlToken = gqlQueryResult.data?.token
    const logoUrlOverride = isV2TokensEnabled ? restToken?.project?.logoUrl : gqlToken?.project?.logoUrl
    const projectIdOverride = isV2TokensEnabled ? undefined : gqlToken?.project?.id

    if (chainId && address) {
      const commonBase = getCommonBase(chainId, address)
      if (commonBase) {
        // Creating new object to avoid error "Cannot assign to read only property"
        const copyCommonBase = { ...commonBase }
        // Related to TODO(WEB-5111)
        // Some common base images are broken so this'll ensure we read from uniswap images
        if (logoUrlOverride) {
          copyCommonBase.logoUrl = logoUrlOverride
        }
        copyCommonBase.currencyId = _currencyId

        // Local common base object will not have remote project id, so we add it here.
        copyCommonBase.projectId = projectIdOverride

        return copyCommonBase
      }
    }

    if (isV2TokensEnabled) {
      return restToken && restV2TokenToCurrencyInfo(restToken)
    } else {
      return gqlToken && gqlTokenToCurrencyInfo(gqlToken)
    }
  }, [_currencyId, isV2TokensEnabled, restQueryResult.data?.token, gqlQueryResult.data?.token])

  return {
    currencyInfo,
    loading: isV2TokensEnabled ? restQueryResult.isLoading : gqlQueryResult.loading,
    error: (isV2TokensEnabled ? restQueryResult.error : gqlQueryResult.error) ?? undefined,
  }
}

// GetTokensResponse is best-effort: the response may omit unfound tokens or return them out
// of order, so results must be matched back to the request by chainId+address.
function restTokenKey(chainId: number, address: string): string {
  return `${chainId}-${address.toLowerCase()}`
}

function useRestCurrencyInfos(
  currencyIds: string[],
  options?: { skip?: boolean },
): { data: Maybe<CurrencyInfo>[]; loading: boolean; error?: Error } {
  const restParams = useMemo(
    () => ({ tokens: currencyIds.map((id) => currencyIdToRestContractInput(id)) }),
    [currencyIds],
  )

  const queryResult = useQuery(
    getGetTokensQueryOptions({
      params: restParams,
      enabled: !options?.skip && !!currencyIds.length,
    }),
  )

  const data = useMemo(() => {
    const tokenByKey = new Map(
      (queryResult.data?.tokens ?? []).map((token) => [restTokenKey(token.chainId, token.address), token]),
    )

    return currencyIds.map((id) => {
      const chainId = currencyIdToChain(id)
      let address: Address | undefined
      try {
        address = currencyIdToAddress(id)
      } catch (_error) {
        return undefined
      }
      if (!chainId || !address) {
        return undefined
      }
      const token = tokenByKey.get(restTokenKey(chainId, address))
      return token && restV2TokenToCurrencyInfo(token)
    })
  }, [currencyIds, queryResult.data?.tokens])

  return { data, loading: queryResult.isLoading, error: queryResult.error ?? undefined }
}

export function useCurrencyInfo(
  _currencyId?: string,
  options?: { refetch?: boolean; skip?: boolean },
): Maybe<CurrencyInfo> {
  const { currencyInfo } = useCurrencyInfoQuery(_currencyId, options)
  return currencyInfo
}

export function useCurrencyInfoWithLoading(
  _currencyId?: string,
  options?: { refetch?: boolean; skip?: boolean },
): {
  currencyInfo: Maybe<CurrencyInfo>
  loading: boolean
  error?: Error
} {
  return useCurrencyInfoQuery(_currencyId, options)
}

export function useCurrencyInfos(
  _currencyIds: string[],
  options?: { refetch?: boolean; skip?: boolean },
): Maybe<CurrencyInfo>[] {
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)

  const restResult = useRestCurrencyInfos(_currencyIds, { skip: !isV2TokensEnabled || options?.skip })

  const { data: graphQLResult } = GraphQLApi.useTokensQuery({
    variables: {
      contracts: _currencyIds.map(currencyIdToContractInput),
    },
    skip: !_currencyIds.length || options?.skip || isV2TokensEnabled,
    fetchPolicy: options?.refetch ? 'cache-and-network' : 'cache-first',
  })

  return useMemo(() => {
    if (isV2TokensEnabled) {
      return restResult.data
    }
    return graphQLResult?.tokens?.map((token) => token && gqlTokenToCurrencyInfo(token)) ?? []
  }, [isV2TokensEnabled, restResult.data, graphQLResult])
}

export function useCurrencyInfosWithLoading(
  _currencyIds: string[],
  options?: { refetch?: boolean; skip?: boolean },
): GqlResult<CurrencyInfo[]> {
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)

  const restResult = useRestCurrencyInfos(_currencyIds, { skip: !isV2TokensEnabled || options?.skip })

  const graphQLResult = GraphQLApi.useTokensQuery({
    variables: {
      contracts: _currencyIds.map(currencyIdToContractInput),
    },
    skip: !_currencyIds.length || options?.skip || isV2TokensEnabled,
    fetchPolicy: options?.refetch ? 'cache-and-network' : 'cache-first',
  })

  return useMemo(() => {
    if (isV2TokensEnabled) {
      return {
        data: restResult.data.filter((currencyInfo): currencyInfo is CurrencyInfo => !!currencyInfo),
        loading: restResult.loading,
        error: restResult.error,
        refetch: graphQLResult.refetch,
      }
    }
    return {
      data:
        graphQLResult.data?.tokens
          ?.map((token) => token && gqlTokenToCurrencyInfo(token))
          .filter((currencyInfo) => !!currencyInfo) ?? [],
      loading: graphQLResult.loading,
      error: graphQLResult.error,
      refetch: graphQLResult.refetch,
    }
  }, [
    isV2TokensEnabled,
    restResult.data,
    restResult.loading,
    restResult.error,
    graphQLResult.data?.tokens,
    graphQLResult.loading,
    graphQLResult.error,
    graphQLResult.refetch,
  ])
}

export function useNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const nativeCurrencyId = buildNativeCurrencyId(chainId)
  return useCurrencyInfo(nativeCurrencyId)
}

export function useWrappedNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const wrappedCurrencyId = buildWrappedNativeCurrencyId(chainId)
  return useCurrencyInfo(wrappedCurrencyId)
}
