import { useMemo, useRef } from 'react'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useInfiniteScroll } from 'utilities/src/react/useInfiniteScroll'
import { ONE_DAY_MS } from 'utilities/src/time/time'
import { ActivityFilterType } from '~/pages/Portfolio/Activity/Filters/activityFilterTypes'
import {
  filterTransactionDetailsFromActivityItems,
  getServerTransactionTypesForFilter,
  getTransactionTypeForActivityFilter,
  getTransactionTypesForFilter,
  TimePeriod,
} from '~/pages/Portfolio/Activity/Filters/utils'
import { filterDefinedWalletAddresses } from '~/utils/filterDefinedWalletAddresses'

function isWithinTimePeriod(txTime: number, period: string): boolean {
  if (period === TimePeriod.All) {
    return true
  }

  const now = Date.now()
  const timeDiff = now - txTime

  const PERIODS: Record<string, number> = {
    [TimePeriod.Last24Hours]: ONE_DAY_MS,
    [TimePeriod.Last7Days]: 7 * ONE_DAY_MS,
    [TimePeriod.Last30Days]: 30 * ONE_DAY_MS,
  }

  return timeDiff <= (PERIODS[period] || Infinity)
}

function filterTransactions({
  transactions,
  typeFilter,
  timeFilter,
  isEarnActivityDisplayEnabled,
}: {
  transactions: ActivityItem[]
  typeFilter: string
  timeFilter: string
  isEarnActivityDisplayEnabled: boolean
}): TransactionDetails[] {
  const allowedTypes = getTransactionTypesForFilter(typeFilter)

  return filterTransactionDetailsFromActivityItems(transactions)
    .filter(
      (tx) =>
        allowedTypes === 'all' ||
        allowedTypes.includes(
          getTransactionTypeForActivityFilter({
            transaction: tx,
            isEarnActivityDisplayEnabled,
          }),
        ),
    )
    .filter((tx) => isWithinTimePeriod(tx.addedTime, timeFilter))
}

interface UseActivityFilteringParams {
  evmAddress: string | undefined
  svmAddress: string | undefined
  chainId: UniverseChainId | undefined
  selectedTransactionType: string
  selectedTimePeriod: string
  searchText?: string
}

interface UseActivityFilteringResult {
  /** Filtered transaction data ready for display */
  transactionData: TransactionDetails[]
  /** Raw section data before client-side filtering (for empty state detection) */
  sectionData: ActivityItem[] | undefined
  /** Whether to show loading skeleton */
  showLoading: boolean
  /** Whether more pages are being fetched */
  isFetchingNextPage: boolean
  /** Ref to attach to the infinite scroll sentinel element */
  sentinelRef: React.MutableRefObject<HTMLElement | null>
  /** Whether server-side filtering is being used */
  isUsingServerFiltering: boolean
  /** Error from the underlying activity data fetch, if any. */
  error: Error | undefined
  /** Epoch ms when activity data was last successfully fetched. */
  dataUpdatedAt: number | undefined
  /** Whether Earn-specific activity metadata should be rendered. */
  isEarnActivityDisplayEnabled: boolean
}

/**
 * Hook that manages activity data fetching with intelligent server-side vs client-side filtering.
 *
 * Server-side filtering is used for EVM-only wallets when a type filter is applied.
 * For wallets with Solana addresses, we fall back to client-side filtering since
 * server-side filtering would exclude Solana transactions.
 *
 * Also handles loading state transitions when chain or filter changes, ensuring
 * proper skeleton display instead of stale data.
 */
export function useActivityFiltering({
  evmAddress,
  svmAddress,
  chainId,
  selectedTransactionType,
  selectedTimePeriod,
  searchText,
}: UseActivityFilteringParams): UseActivityFilteringResult {
  const isEarnActivityDisplayEnabled = useIsEarnEnabled()

  // Determine if we can use server-side filtering (EVM-only wallet)
  // Server-side filtering only works for EVM and will filter out all Solana transactions
  const canUseServerSideFiltering = !!evmAddress && !svmAddress

  // Get server filter types only if applicable (EVM-only and filter is not 'All')
  const serverFilterTypes = useMemo(() => {
    if (!canUseServerSideFiltering || selectedTransactionType === ActivityFilterType.All) {
      return undefined
    }
    return getServerTransactionTypesForFilter({
      filterType: selectedTransactionType,
      isEarnEnabled: isEarnActivityDisplayEnabled,
    })
  }, [canUseServerSideFiltering, selectedTransactionType, isEarnActivityDisplayEnabled])

  const { sectionData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching, error, dataUpdatedAt } =
    useActivityData({
      evmOwner: evmAddress,
      svmOwner: svmAddress,
      ownerAddresses: filterDefinedWalletAddresses([evmAddress, svmAddress]),
      fiatOnRampParams: undefined,
      chainIds: chainId ? [chainId] : undefined,
      filterTransactionTypes: serverFilterTypes,
      searchText,
      maxItems: Infinity,
    })

  // Track chainId changes to show loading skeleton when switching networks
  // We need this because placeholderData keeps old data visible during refetch,
  // but we want to show a skeleton when the chain filter changes
  const prevChainIdRef = useRef(chainId)
  const chainIdChanged = prevChainIdRef.current !== chainId
  if (chainIdChanged && !isFetching) {
    // Update ref once we're done fetching for the new chainId
    prevChainIdRef.current = chainId
  }

  // Track server-side filter changes to show loading skeleton when filter changes
  const prevServerFilterTypesRef = useRef(serverFilterTypes)
  const serverFilterChanged = prevServerFilterTypesRef.current !== serverFilterTypes
  if (serverFilterChanged && !isFetching) {
    // Update ref once we're done fetching for the new filter
    prevServerFilterTypesRef.current = serverFilterTypes
  }

  const prevSearchTextRef = useRef(searchText)
  const searchTextChanged = prevSearchTextRef.current !== searchText
  if (searchTextChanged && !isFetching) {
    prevSearchTextRef.current = searchText
  }

  // Show loading skeleton when:
  // 1. Initial load (isLoading is true, no cached data)
  // 2. Fetching with no data to display yet (e.g. cache cleared or empty cached result being refetched)
  // 3. Chain filter changed and we're fetching new data
  // 4. Server-side transaction type filter changed and we're fetching new data
  const showLoading =
    isLoading ||
    (isFetching && !sectionData?.length) ||
    (chainIdChanged && isFetching) ||
    (serverFilterChanged && isFetching) ||
    (searchTextChanged && isFetching) ||
    (!!error && !sectionData?.length)

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasNextPage,
    isFetching: isFetchingNextPage,
  })

  // Filter out section headers and loading items to get just transaction data
  // Skip client-side type filtering when server-side filtering is active
  const transactionData: TransactionDetails[] = useMemo(
    () =>
      filterTransactions({
        transactions: sectionData || [],
        // Always apply client-side type filtering — local transactions bypass server-side filtering
        typeFilter: selectedTransactionType,
        timeFilter: selectedTimePeriod,
        isEarnActivityDisplayEnabled,
      }),
    [sectionData, selectedTransactionType, selectedTimePeriod, isEarnActivityDisplayEnabled],
  )

  return {
    transactionData,
    sectionData,
    showLoading,
    isFetchingNextPage,
    sentinelRef,
    isUsingServerFiltering: !!serverFilterTypes,
    error,
    dataUpdatedAt,
    isEarnActivityDisplayEnabled,
  }
}
