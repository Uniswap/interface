import { PartialMessage } from '@bufbuild/protobuf'
import { FiatOnRampParams, ListTransactionsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useListTransactionsQuery } from 'uniswap/src/data/rest/listTransactions'
import { parseRestResponseToTransactionDetails } from 'uniswap/src/features/activity/parseRestResponse'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { mapRestStatusToNetworkStatus } from 'uniswap/src/features/dataApi/balances/utils'
import { BaseResult, PaginationControls } from 'uniswap/src/features/dataApi/types'
import { useHideReportedActivitySetting } from 'uniswap/src/features/settings/hooks'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { selectActivityVisibility } from 'uniswap/src/features/visibility/selectors'
import { CurrencyIdToVisibility, NFTKeyToVisibility } from 'uniswap/src/features/visibility/slice'

const DEFAULT_PAGE_SIZE = 100

export type TransactionListDataResult = BaseResult<TransactionDetails[]> & PaginationControls
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

  const {
    data: infiniteData,
    isLoading,
    error,
    refetch,
    status: restStatus,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListTransactionsQuery({
    input: {
      evmAddress,
      svmAddress,
      chainIds: finalChainIds,
      pageSize: finalPageSize,
      fiatOnRampParams,
    },
    enabled: !!(evmAddress || svmAddress) && !skip,
  })

  // Flatten all pages and parse transaction data
  const formattedTransactions = useMemo(() => {
    if (!infiniteData?.pages.length) {
      return undefined
    }

    const flattenedTransactions = infiniteData.pages
      .filter((page): page is ListTransactionsResponse => page !== undefined)
      .flatMap((page) => Array.from(page.transactions))
      // Transactions appear incomplete when the app first loads
      // Type assertion needed because protobuf types assume transaction always exists
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      .filter((transaction) => transaction.transaction !== undefined)

    const dedupedTransactions = dedupeTransactions(flattenedTransactions)

    // Create a flattened response to parse
    const flattenedResponse: ListTransactionsResponse = {
      transactions: dedupedTransactions,
      nextPageToken: infiniteData.pages[infiniteData.pages.length - 1]?.nextPageToken,
    } as ListTransactionsResponse

    const parsedTransactions = parseRestResponseToTransactionDetails({
      data: flattenedResponse,
      hideSpamTokens,
      nftVisibility,
      tokenVisibilityOverrides,
    })

    return parsedTransactions
  }, [infiniteData, hideSpamTokens, nftVisibility, tokenVisibilityOverrides])

  const filteredTransactions = useFilteredTransactionsByVisibility(formattedTransactions)

  return {
    data: filteredTransactions,
    loading: isLoading,
    networkStatus: mapRestStatusToNetworkStatus(restStatus),
    refetch,
    error: error ?? undefined,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
  }
}

function dedupeTransactions(
  transactions: ListTransactionsResponse['transactions'],
): ListTransactionsResponse['transactions'] {
  const seenTransactionHashes = new Set<string>()

  return transactions.filter((transaction) => {
    const uniqueId = getUniqueTransactionId(transaction)

    // If there's no unique ID we can't dedupe it, so keep it
    if (!uniqueId) {
      return true
    }

    if (seenTransactionHashes.has(uniqueId)) {
      return false
    }

    seenTransactionHashes.add(uniqueId)
    return true
  })
}

function useFilteredTransactionsByVisibility(
  transactions: TransactionDetails[] | undefined,
): TransactionDetails[] | undefined {
  const isDataReportingAbilitiesEnabled = useFeatureFlag(FeatureFlags.DataReportingAbilities)
  const activityIdToVisibility = useSelector(selectActivityVisibility)
  const hideReportedActivity = useHideReportedActivitySetting()

  // Skip filtering if data reporting abilities are not enabled or there are no transactions
  if (!hideReportedActivity || !isDataReportingAbilitiesEnabled) {
    return transactions
  }

  return transactions?.filter((transaction) => activityIdToVisibility[transaction.id]?.isVisible ?? true)
}

function getUniqueTransactionId(transaction: ListTransactionsResponse['transactions'][0]): string | undefined {
  switch (transaction.transaction.case) {
    case 'onChain':
      return transaction.transaction.value.transactionHash
    case 'uniswapX':
      return transaction.transaction.value.orderHash
    case 'fiatOnRamp':
      return transaction.transaction.value.externalSessionId
    default:
      return undefined
  }
}
