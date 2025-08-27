import { QueryHookOptions } from '@apollo/client'
import { PartialMessage } from '@bufbuild/protobuf'
import { FiatOnRampParams, ListTransactionsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import {
  TransactionListQuery,
  TransactionListQueryVariables,
  useTransactionListQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useListTransactionsQuery } from 'uniswap/src/data/rest/listTransactions'
import {
  parseDataResponseToTransactionDetails,
  parseRestResponseToTransactionDetails,
} from 'uniswap/src/features/activity/parseRestResponse'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { mapRestStatusToNetworkStatus } from 'uniswap/src/features/dataApi/balances/utils'
import { BaseResult } from 'uniswap/src/features/dataApi/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyIdToVisibility, NFTKeyToVisibility } from 'uniswap/src/features/visibility/slice'
import { usePlatformBasedFetchPolicy } from 'uniswap/src/utils/usePlatformBasedFetchPolicy'
import { useEvent } from 'utilities/src/react/hooks'

export type TransactionListDataResult = BaseResult<TransactionDetails[]>
type ListTransactionsQueryArgs = {
  address?: Address
  pageSize?: number
  hideSpamTokens?: boolean
  tokenVisibilityOverrides?: CurrencyIdToVisibility
  nftVisibility?: NFTKeyToVisibility
  chainIds?: UniverseChainId[]
  fiatOnRampParams?: PartialMessage<FiatOnRampParams>
}

/**
 * Factory hook that returns transaction activity data based on the active data source (GraphQL or REST)
 */
export function useListTransactions({
  address,
  pageSize,
  hideSpamTokens = false,
  tokenVisibilityOverrides,
  nftVisibility,
  chainIds,
  fiatOnRampParams,
  ...queryOptions
}: ListTransactionsQueryArgs &
  QueryHookOptions<TransactionListQuery, TransactionListQueryVariables>): TransactionListDataResult {
  const isRestEnabled = useFeatureFlag(FeatureFlags.GqlToRestTransactions)

  const graphqlResult = useGraphQLListTransactionsData({
    address,
    pageSize,
    hideSpamTokens,
    tokenVisibilityOverrides,
    nftVisibility,
    chainIds,
    fiatOnRampParams,
    ...queryOptions,
    skip: isRestEnabled || queryOptions.skip,
  })

  const restResult = useRESTListTransactionsData({
    address,
    pageSize,
    hideSpamTokens,
    tokenVisibilityOverrides,
    nftVisibility,
    chainIds,
    fiatOnRampParams,
    skip: !address || !isRestEnabled || queryOptions.skip,
  })

  const result = isRestEnabled ? restResult : graphqlResult

  return result
}

/**
 * GraphQL implementation for fetching transaction activity data
 */
function useGraphQLListTransactionsData({
  address,
  pageSize,
  hideSpamTokens,
  tokenVisibilityOverrides,
  nftVisibility,
  chainIds,

  ...queryOptions
}: ListTransactionsQueryArgs &
  QueryHookOptions<TransactionListQuery, TransactionListQueryVariables>): TransactionListDataResult {
  const { fetchPolicy: internalFetchPolicy, pollInterval: internalPollInterval } = usePlatformBasedFetchPolicy({
    fetchPolicy: queryOptions.fetchPolicy,
    pollInterval: queryOptions.pollInterval,
  })

  const { gqlChains } = useEnabledChains()
  // Convert UniverseChainId[] to GqlChainId[] for GraphQL
  const chains = chainIds ? chainIds.map(toGraphQLChain) : gqlChains

  const { data, loading, networkStatus, refetch, error } = useTransactionListQuery({
    ...queryOptions,
    fetchPolicy: internalFetchPolicy,
    notifyOnNetworkStatusChange: true,
    pollInterval: internalPollInterval,
    variables: address ? { address, chains, pageSize } : undefined,
    skip: !address || queryOptions.skip,
    errorPolicy: 'none',
  })

  const transactionDetails = useMemo(() => {
    if (!data?.portfolios?.[0]?.assetActivities) {
      return undefined
    }

    return parseDataResponseToTransactionDetails({
      data,
      hideSpamTokens: hideSpamTokens ?? false,
      nftVisibility,
      tokenVisibilityOverrides,
    })
  }, [data, hideSpamTokens, nftVisibility, tokenVisibilityOverrides])

  return {
    data: transactionDetails,
    loading,
    networkStatus,
    refetch,
    error,
  }
}

/**
 * REST implementation for fetching transaction activity data
 */
function useRESTListTransactionsData({
  address,
  pageSize,
  hideSpamTokens,
  tokenVisibilityOverrides,
  nftVisibility,
  chainIds,
  skip,
  fiatOnRampParams,
}: ListTransactionsQueryArgs & { skip?: boolean }): TransactionListDataResult {
  const { chains: defaultChainIds } = useEnabledChains()
  // Use provided chainIds or fallback to default chains
  const finalChainIds = chainIds || defaultChainIds

  const selectFormattedData = useEvent((transactionData: ListTransactionsResponse | undefined) => {
    if (!transactionData) {
      return undefined
    }

    return parseRestResponseToTransactionDetails({
      data: transactionData,
      hideSpamTokens: hideSpamTokens ?? false,
      nftVisibility,
      tokenVisibilityOverrides,
    })
  })

  const {
    data: formattedTransactions,
    isLoading,
    error,
    refetch,
    status: restStatus,
  } = useListTransactionsQuery({
    input: {
      evmAddress: address || '',
      chainIds: finalChainIds,
      pageSize,
      fiatOnRampParams,
    },
    enabled: !skip,
    select: selectFormattedData,
  })

  return {
    data: formattedTransactions,
    loading: isLoading,
    networkStatus: mapRestStatusToNetworkStatus(restStatus),
    refetch,
    error: error ?? undefined,
  }
}
