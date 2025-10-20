import { PartialMessage } from '@bufbuild/protobuf'
import { FiatOnRampParams, ListTransactionsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useListTransactionsQuery } from 'uniswap/src/data/rest/listTransactions'
import { parseRestResponseToTransactionDetails } from 'uniswap/src/features/activity/parseRestResponse'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { mapRestStatusToNetworkStatus } from 'uniswap/src/features/dataApi/balances/utils'
import { BaseResult } from 'uniswap/src/features/dataApi/types'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyIdToVisibility, NFTKeyToVisibility } from 'uniswap/src/features/visibility/slice'
import { useEvent } from 'utilities/src/react/hooks'

const DEFAULT_PAGE_SIZE = 100

export type TransactionListDataResult = BaseResult<TransactionDetails[]>
type ListTransactionsQueryArgs = {
  evmAddress?: Address
  svmAddress?: Address
  pageSize?: number
  hideSpamTokens?: boolean
  tokenVisibilityOverrides?: CurrencyIdToVisibility
  nftVisibility?: NFTKeyToVisibility
  chainIds?: UniverseChainId[]
  fiatOnRampParams?: PartialMessage<FiatOnRampParams>
}

/**
 * REST implementation for fetching transaction activity data
 */
export function useListTransactions({
  evmAddress,
  svmAddress,
  pageSize,
  hideSpamTokens = false,
  tokenVisibilityOverrides,
  nftVisibility,
  chainIds,
  skip,
  fiatOnRampParams,
}: ListTransactionsQueryArgs & { skip?: boolean }): TransactionListDataResult {
  const { chains: defaultChainIds } = useEnabledChains()
  // Use provided chainIds or fallback to default chains
  const finalChainIds = chainIds || defaultChainIds
  // Use provided pageSize or fallback to default
  const finalPageSize = pageSize ?? DEFAULT_PAGE_SIZE

  const selectFormattedData = useEvent((transactionData: ListTransactionsResponse | undefined) => {
    if (!transactionData) {
      return undefined
    }

    return parseRestResponseToTransactionDetails({
      data: transactionData,
      hideSpamTokens,
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
      evmAddress,
      svmAddress,
      chainIds: finalChainIds,
      pageSize: finalPageSize,
      fiatOnRampParams,
    },
    enabled: !!(evmAddress || svmAddress) && !skip,
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
