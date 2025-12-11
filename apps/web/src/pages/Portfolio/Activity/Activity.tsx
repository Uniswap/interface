import { Row } from '@tanstack/react-table'
import { SharedEventName } from '@uniswap/analytics-events'
import { POPUP_MEDIUM_DISMISS_MS } from 'components/Popups/constants'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { ActivityFilters } from 'pages/Portfolio/Activity/ActivityFilters'
import { ActivityTable } from 'pages/Portfolio/Activity/ActivityTable/ActivityTable'
import {
  filterTransactionDetailsFromActivityItems,
  getTransactionTypesForFilter,
} from 'pages/Portfolio/Activity/Filters/utils'
import { PaginationSkeletonRow } from 'pages/Portfolio/Activity/PaginationSkeletonRow'
import { usePortfolioRoutes } from 'pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from 'pages/Portfolio/hooks/usePortfolioAddresses'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, TouchableArea } from 'ui/src'
import { ActivityListEmptyState } from 'uniswap/src/components/activity/ActivityListEmptyState'
import { TransactionDetailsModal } from 'uniswap/src/components/activity/details/TransactionDetailsModal'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { ElementName, InterfacePageName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useEvent } from 'utilities/src/react/hooks'
import { useInfiniteScroll } from 'utilities/src/react/useInfiniteScroll'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { ONE_DAY_MS } from 'utilities/src/time/time'
import { filterDefinedWalletAddresses } from 'utils/filterDefinedWalletAddresses'

function isWithinTimePeriod(txTime: number, period: string): boolean {
  if (period === 'all') {
    return true
  }

  const now = Date.now()
  const timeDiff = now - txTime

  const PERIODS: Record<string, number> = {
    '24h': ONE_DAY_MS,
    '7d': 7 * ONE_DAY_MS,
    '30d': 30 * ONE_DAY_MS,
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

export default function PortfolioActivity() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const trace = useTrace()
  const [selectedTransactionType, setSelectedTransactionType] = useState('all')
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('all')
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetails | null>(null)

  const { evmAddress, svmAddress } = usePortfolioAddresses()
  const { chainId } = usePortfolioRoutes()

  const { sectionData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching } = useActivityData({
    evmOwner: evmAddress,
    svmOwner: svmAddress,
    ownerAddresses: filterDefinedWalletAddresses([evmAddress, svmAddress]),
    fiatOnRampParams: undefined,
    chainIds: chainId ? [chainId] : undefined,
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

  // Show loading skeleton when:
  // 1. Initial load (isLoading is true, no cached data)
  // 2. Chain filter changed and we're fetching new data
  const showLoading = isLoading || (chainIdChanged && isFetching)

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasNextPage,
    isFetching: isFetchingNextPage,
  })

  // Filter out section headers and loading items to get just transaction data
  const transactionData: TransactionDetails[] = useMemo(
    () =>
      filterTransactions({
        transactions: sectionData || [],
        typeFilter: selectedTransactionType,
        timeFilter: selectedTimePeriod,
      }),
    [sectionData, selectedTransactionType, selectedTimePeriod],
  )

  const error = false

  const handleTransactionClick = useEvent((transaction: TransactionDetails) => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.ActivityRow,
      section: SectionName.PortfolioActivityTab,
      ...trace,
    })
    setSelectedTransaction(transaction)
  })

  const rowWrapper = useEvent((row: Row<TransactionDetails>, content: JSX.Element) => {
    const transaction = row.original
    return (
      <TouchableArea onPress={() => handleTransactionClick(transaction)} cursor="pointer">
        {content}
      </TouchableArea>
    )
  })

  const handleCloseTransactionDetails = () => {
    setSelectedTransaction(null)
  }

  const onReportSuccess = useEvent(() => {
    popupRegistry.addPopup(
      { type: PopupType.Success, message: t('common.reported') },
      'report-transaction-success',
      POPUP_MEDIUM_DISMISS_MS,
    )
  })

  const onUnhideTransaction = useEvent(() => {
    popupRegistry.addPopup(
      { type: PopupType.Unhide, assetName: t('common.activity') },
      'unhide-transaction-success',
      POPUP_MEDIUM_DISMISS_MS,
    )
  })

  // Handler to clear chain filter and show all networks
  const handleShowAllNetworks = useCallback(() => {
    navigate('/portfolio/activity')
  }, [navigate])

  // Custom empty state for chain filtering
  const chainFilterEmptyState = useMemo(() => {
    if (!chainId) {
      return undefined
    }
    const chainName = getChainLabel(chainId)
    return (
      <ActivityListEmptyState
        description={null}
        buttonLabel={t('portfolio.networkFilter.seeAllNetworks')}
        onPress={handleShowAllNetworks}
        title={t('activity.list.noneOnChain.title', { chainName })}
      />
    )
  }, [handleShowAllNetworks, chainId, t])

  return (
    <Trace logImpression page={InterfacePageName.PortfolioActivityPage}>
      <Flex gap="$spacing28" mt="$spacing12">
        {/* Filtering Controls */}
        <Trace section={SectionName.PortfolioActivityTab} element={ElementName.ActivityFilters}>
          <ActivityFilters
            selectedTransactionType={selectedTransactionType}
            onTransactionTypeChange={setSelectedTransactionType}
            selectedTimePeriod={selectedTimePeriod}
            onTimePeriodChange={setSelectedTimePeriod}
          />
        </Trace>

        <Flex>
          {!showLoading && transactionData.length === 0 ? (
            chainId ? (
              chainFilterEmptyState
            ) : (
              <ActivityListEmptyState />
            )
          ) : (
            <Trace section={SectionName.PortfolioActivityTab} element={ElementName.PortfolioActivityTable}>
              <>
                <ActivityTable data={transactionData} loading={showLoading} error={error} rowWrapper={rowWrapper} />

                {/* Show skeleton loading indicator while fetching next page */}
                {isFetchingNextPage && <PaginationSkeletonRow />}

                {/* Intersection observer sentinel for infinite scroll */}
                <Flex ref={sentinelRef} height={1} my={10} />
              </>
            </Trace>
          )}
        </Flex>

        {selectedTransaction && (
          <TransactionDetailsModal
            transactionDetails={selectedTransaction}
            onClose={handleCloseTransactionDetails}
            authTrigger={undefined}
            onReportSuccess={onReportSuccess}
            onUnhideTransaction={onUnhideTransaction}
          />
        )}
      </Flex>
    </Trace>
  )
}
