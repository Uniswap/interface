import type { PartialMessage } from '@bufbuild/protobuf'
import type { FiatOnRampParams, ListTransactionsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { TransactionTypeFilter } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { UniverseChainId } from '@universe/chains'
import { isWebPlatform } from '@universe/environment'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useListTransactionsQuery } from 'uniswap/src/data/apiClients/dataApiService/activity/listTransactions'
import { parseToTransactionDetails } from 'uniswap/src/features/activity/parseToTransactionDetails'
import { isDustReceive } from 'uniswap/src/features/activity/utils/isDustReceive'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { BaseResult, PaginationControls } from 'uniswap/src/features/dataApi/types'
import { useHideReportedActivitySetting } from 'uniswap/src/features/settings/hooks'
import type { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { selectActivityVisibility } from 'uniswap/src/features/visibility/selectors'
import type { CurrencyIdToVisibility, NFTKeyToVisibility } from 'uniswap/src/features/visibility/slice'

const DEFAULT_PAGE_SIZE = isWebPlatform ? 100 : 20

// The backend rejects `search_text` outside of this range with an `invalid_argument` error, so
// out-of-range input is normalized here instead of being sent and surfacing as a failed request.
const MIN_SEARCH_TEXT_LENGTH = 2
const MAX_SEARCH_TEXT_LENGTH = 64

/**
 * Returns the search text to send to the API, or `undefined` when the input can't be searched on
 * (i.e. too short) and results should stay unfiltered.
 */
export function normalizeTransactionSearchText(searchText: string | undefined): string | undefined {
  const trimmed = searchText?.trim()

  if (!trimmed || trimmed.length < MIN_SEARCH_TEXT_LENGTH) {
    return undefined
  }

  return trimmed.slice(0, MAX_SEARCH_TEXT_LENGTH)
}

export type TransactionListDataResult = BaseResult<TransactionDetails[]> &
  PaginationControls & {
    isFetching: boolean
    isFetchNextPageError: boolean
  }
type ListTransactionsQueryArgs = {
  evmAddress?: Address
  svmAddress?: Address
  pageSize?: number
  hideSpamTokens?: boolean
  tokenVisibilityOverrides?: CurrencyIdToVisibility
  nftVisibility?: NFTKeyToVisibility
  chainIds?: UniverseChainId[]
  fiatOnRampParams?: PartialMessage<FiatOnRampParams>
  filterTransactionTypes?: TransactionTypeFilter[]
  searchText?: string
  refetchInterval?: number
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
  filterTransactionTypes,
  searchText,
  refetchInterval,
}: ListTransactionsQueryArgs & { skip?: boolean }): TransactionListDataResult {
  const { chains: defaultChainIds } = useEnabledChains()
  // Use provided chainIds or fallback to default chains
  const finalChainIds = chainIds || defaultChainIds
  // Use provided pageSize or fallback to default
  const finalPageSize = pageSize ?? DEFAULT_PAGE_SIZE

  const {
    data: infiniteData,
    isLoading,
    isFetching,
    error,
    refetch,
    isPending,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    dataUpdatedAt,
  } = useListTransactionsQuery({
    input: {
      evmAddress,
      svmAddress,
      chainIds: finalChainIds,
      pageSize: finalPageSize,
      fiatOnRampParams,
      filterTransactionTypes,
      searchText: normalizeTransactionSearchText(searchText),
    },
    enabled: !!(evmAddress || svmAddress) && !skip,
    refetchInterval,
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
      // oxlint-disable-next-line typescript/no-unnecessary-condition
      .filter((transaction) => transaction.transaction !== undefined)

    const dedupedTransactions = dedupeTransactions(flattenedTransactions)

    // Create a flattened response to parse
    const flattenedResponse: ListTransactionsResponse = {
      transactions: dedupedTransactions,
      nextPageToken: infiniteData.pages[infiniteData.pages.length - 1]?.nextPageToken,
    } as ListTransactionsResponse

    const parsedTransactions = parseToTransactionDetails({
      transactions: flattenedResponse.transactions,
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
    isFetching,
    isPending,
    isError,
    refetch,
    error: error || undefined,
    dataUpdatedAt: dataUpdatedAt || undefined,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError: !!isFetchNextPageError,
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
  const activityIdToVisibility = useSelector(selectActivityVisibility)
  const hideReportedActivity = useHideReportedActivitySetting()

  // Skip filtering if hide reported activity is disabled from the user's settings
  if (!hideReportedActivity) {
    return transactions
  }

  return transactions?.filter(
    (transaction) => (activityIdToVisibility[transaction.id]?.isVisible ?? true) && !isDustReceive(transaction),
  )
}

function getUniqueTransactionId(transaction: ListTransactionsResponse['transactions'][0]): string | undefined {
  switch (transaction.transaction.case) {
    case 'plan':
      return transaction.transaction.value.planId
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
