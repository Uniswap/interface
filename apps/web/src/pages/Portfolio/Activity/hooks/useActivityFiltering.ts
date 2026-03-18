import { useMemo, useRef } from 'react'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useInfiniteScroll } from 'utilities/src/react/useInfiniteScroll'
import { ONE_DAY_MS } from 'utilities/src/time/time'
import {
  ActivityFilterType,
  filterTransactionDetailsFromActivityItems,
  getTransactionTypesForFilter,
  SERVER_FILTER_MAP,
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
}: {
  transactions: ActivityItem[]
  typeFilter: string
  timeFilter: string
}): TransactionDetails[] {
  const allowedTypes = getTransactionTypesForFilter(typeFilter)

  return filterTransactionDetailsFromActivityItems(transactions)
    .filter((tx) => allowedTypes === 'all' || allowedTypes.includes(tx.typeInfo.type))
    .filter((tx) => isWithinTimePeriod(tx.addedTime, timeFilter))
}

interface UseActivityFilteringParams {
  evmAddress: string | undefined
  svmAddress: string | undefined
  chainId: UniverseChainId | undefined
  selectedTransactionType: string
  selectedTimePeriod: string
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
}: UseActivityFilteringParams): UseActivityFilteringResult {
  // Determine if we can use server-side filtering (EVM-only wallet)
  // Server-side filtering only works for EVM and will filter out all Solana transactions
  const canUseServerSideFiltering = !!evmAddress && !svmAddress

  // Get server filter types only if applicable (EVM-only and filter is not 'All')
  const serverFilterTypes = useMemo(() => {
    if (!canUseServerSideFiltering || selectedTransactionType === ActivityFilterType.All) {
      return undefined
    }
    return SERVER_FILTER_MAP[selectedTransactionType as ActivityFilterType]
  }, [canUseServerSideFiltering, selectedTransactionType])

  const { sectionData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching } = useActivityData({
    evmOwner: evmAddress,
    svmOwner: svmAddress,
    ownerAddresses: filterDefinedWalletAddresses([evmAddress, svmAddress]),
    fiatOnRampParams: undefined,
    chainIds: chainId ? [chainId] : undefined,
    filterTransactionTypes: serverFilterTypes,
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

  // Show loading skeleton when:
  // 1. Initial load (isLoading is true, no cached data)
  // 2. Chain filter changed and we're fetching new data
  // 3. Server-side transaction type filter changed and we're fetching new data
  const showLoading = isLoading || (chainIdChanged && isFetching) || (serverFilterChanged && isFetching)

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
        // If server-side filtering handled the type filter, skip client-side type filtering
        typeFilter: serverFilterTypes ? ActivityFilterType.All : selectedTransactionType,
        timeFilter: selectedTimePeriod,
      }),
    [sectionData, selectedTransactionType, selectedTimePeriod, serverFilterTypes],
  )

  return {
    transactionData,
    sectionData,
    showLoading,
    isFetchingNextPage,
    sentinelRef,
    isUsingServerFiltering: !!serverFilterTypes,
  }
}
