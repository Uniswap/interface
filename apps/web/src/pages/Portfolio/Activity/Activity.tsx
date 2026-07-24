import { Row } from '@tanstack/react-table'
import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Flex, TouchableArea } from 'ui/src'
import { ElementName, InterfacePageName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { ActivityFilters } from '~/pages/Portfolio/Activity/ActivityFilters'
import { ActivityTable } from '~/pages/Portfolio/Activity/ActivityTable/ActivityTable'
import { ActivityFilterType } from '~/pages/Portfolio/Activity/Filters/activityFilterTypes'
import { TimePeriod } from '~/pages/Portfolio/Activity/Filters/utils'
import { useActivityEmptyState } from '~/pages/Portfolio/Activity/hooks/useActivityEmptyState'
import { useActivityFiltering } from '~/pages/Portfolio/Activity/hooks/useActivityFiltering'
import { PaginationSkeletonRow } from '~/pages/Portfolio/Activity/PaginationSkeletonRow'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { usePortfolioOutageContext } from '~/pages/Portfolio/PortfolioOutageContext'
import { useOpenTransactionDetailsModal } from '~/state/transactionDetailsModalStore'

export function PortfolioActivity() {
  const trace = useTrace()
  const [selectedTransactionType, setSelectedTransactionType] = useState<string>(ActivityFilterType.All)
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>(TimePeriod.All)
  const [searchText, setSearchText] = useState('')
  const openTransactionDetailsModal = useOpenTransactionDetailsModal()

  const { evmAddress, svmAddress } = usePortfolioAddresses()
  const { chainId, isExternalWallet } = usePortfolioRoutes()

  const {
    transactionData,
    sectionData,
    showLoading,
    isFetchingNextPage,
    sentinelRef,
    error,
    dataUpdatedAt,
    isEarnActivityDisplayEnabled,
  } = useActivityFiltering({
    evmAddress,
    svmAddress,
    chainId,
    selectedTransactionType,
    selectedTimePeriod,
    searchText,
  })

  const { setActivityOutage } = usePortfolioOutageContext()
  useEffect(() => {
    setActivityOutage(error, dataUpdatedAt)
    return () => setActivityOutage(undefined, undefined)
  }, [error, dataUpdatedAt, setActivityOutage])

  // Handler to clear type and time filters
  const handleClearFilters = useCallback(() => {
    setSelectedTransactionType(ActivityFilterType.All)
    setSelectedTimePeriod(TimePeriod.All)
    setSearchText('')
  }, [])

  const { shouldShowEmptyState, emptyStateContent } = useActivityEmptyState({
    chainId,
    selectedTransactionType,
    selectedTimePeriod,
    searchText,
    sectionData,
    isExternalWallet,
    showLoading,
    transactionDataLength: transactionData.length,
    onClearFilters: handleClearFilters,
  })

  const tableData = useMemo(
    () =>
      transactionData.map((tx) => ({
        ...tx,
        testId: `${TestID.PortfolioActivityTableRowPrefix}${tx.hash ?? tx.id}`,
      })),
    [transactionData],
  )

  const handleTransactionClick = useEvent((transaction: TransactionDetails) => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.ActivityRow,
      section: SectionName.PortfolioActivityTab,
      ...trace,
    })
    openTransactionDetailsModal(transaction, {
      isExternalProfile: isExternalWallet,
    })
  })

  const rowWrapper = useEvent((row: Row<TransactionDetails>, content: JSX.Element) => {
    const transaction = row.original
    return (
      <TouchableArea onPress={() => handleTransactionClick(transaction)} cursor="pointer" pressStyle={{ scale: 1 }}>
        {content}
      </TouchableArea>
    )
  })

  return (
    <Trace logImpression page={InterfacePageName.PortfolioActivityPage} properties={{ isExternal: isExternalWallet }}>
      <Flex gap="$spacing28" mt="$spacing12">
        {/* Filtering Controls */}
        <Trace section={SectionName.PortfolioActivityTab} element={ElementName.ActivityFilters}>
          <ActivityFilters
            selectedTransactionType={selectedTransactionType}
            onTransactionTypeChange={setSelectedTransactionType}
            selectedTimePeriod={selectedTimePeriod}
            onTimePeriodChange={setSelectedTimePeriod}
            searchText={searchText}
            onSearchTextChange={setSearchText}
          />
        </Trace>

        <Flex>
          {shouldShowEmptyState ? (
            emptyStateContent
          ) : (
            <Trace section={SectionName.PortfolioActivityTab} element={ElementName.PortfolioActivityTable}>
              <>
                <ActivityTable
                  data={tableData}
                  loading={showLoading}
                  error={!!error && !tableData.length}
                  rowWrapper={rowWrapper}
                  isEarnActivityDisplayEnabled={isEarnActivityDisplayEnabled}
                />

                {/* Show skeleton loading indicator while fetching next page */}
                {isFetchingNextPage && <PaginationSkeletonRow />}

                {/* Intersection observer sentinel for infinite scroll */}
                <Flex ref={sentinelRef} height={1} my={10} />
              </>
            </Trace>
          )}
        </Flex>
      </Flex>
    </Trace>
  )
}
