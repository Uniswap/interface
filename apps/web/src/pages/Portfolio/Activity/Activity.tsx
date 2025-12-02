import { Row } from '@tanstack/react-table'
import { DropdownSelector } from 'components/Dropdowns/DropdownSelector'
import { POPUP_MEDIUM_DISMISS_MS } from 'components/Popups/constants'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { Cell } from 'components/Table/Cell'
import { DataRow } from 'components/Table/styled'
import { ActivityTable } from 'pages/Portfolio/Activity/ActivityTable/ActivityTable'
import {
  filterTransactionDetailsFromActivityItems,
  getTimePeriodFilterOptions,
  getTransactionTypeFilterOptions,
  getTransactionTypesForFilter,
} from 'pages/Portfolio/Activity/Filters/utils'
import { SearchInput } from 'pages/Portfolio/components/SearchInput'
import { usePortfolioAddress } from 'pages/Portfolio/hooks/usePortfolioAddress'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, TouchableArea, useMedia } from 'ui/src'
import { Calendar } from 'ui/src/components/icons/Calendar'
import { Filter } from 'ui/src/components/icons/Filter'
import { TransactionDetailsModal } from 'uniswap/src/components/activity/details/TransactionDetailsModal'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { isLoadingItem } from 'uniswap/src/components/activity/utils'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useEvent } from 'utilities/src/react/hooks'
import { useInfiniteScroll } from 'utilities/src/react/useInfiniteScroll'
import { ONE_DAY_MS } from 'utilities/src/time/time'

const DROPDOWN_MIN_WIDTH = {
  transactionType: 220,
  timePeriod: 200,
}

const SEARCH_INPUT_WIDTH = 280

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
  const media = useMedia()
  const transactionTypeOptions = getTransactionTypeFilterOptions(t)
  const timePeriodOptions = getTimePeriodFilterOptions(t)
  const [selectedTransactionType, setSelectedTransactionType] = useState('all')
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('all')
  const [searchValue, setSearchValue] = useState('')
  const [filterTypeExpanded, setFilterTypeExpanded] = useState(false)
  const [timePeriodExpanded, setTimePeriodExpanded] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetails | null>(null)

  const portfolioAddress = usePortfolioAddress()

  const { sectionData, fetchNextPage, hasNextPage, isFetchingNextPage } = useActivityData({
    evmOwner: portfolioAddress,
    ownerAddresses: [portfolioAddress],
    swapCallbacks: {
      useLatestSwapTransaction: () => undefined,
      useSwapFormTransactionState: () => undefined,
      onRetryGenerator: () => () => {},
    },
    fiatOnRampParams: undefined,
  })

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasNextPage,
    isFetching: isFetchingNextPage,
  })

  // Show loading skeleton while data is being fetched (sectionData contains loading items when loading)
  const loading = Boolean(sectionData?.some(isLoadingItem))

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

  const handleTransactionClick = useCallback((transaction: TransactionDetails) => {
    setSelectedTransaction(transaction)
  }, [])

  const rowWrapper = useCallback(
    (row: Row<TransactionDetails>, content: JSX.Element) => {
      const transaction = row.original
      return (
        <TouchableArea onPress={() => handleTransactionClick(transaction)} cursor="pointer">
          {content}
        </TouchableArea>
      )
    },
    [handleTransactionClick],
  )

  const handleCloseTransactionDetails = () => {
    setSelectedTransaction(null)
  }

  const onReportTransaction = useEvent(() => {
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

  return (
    <Trace logImpression page={InterfacePageName.PortfolioActivityPage}>
      <Flex gap="$spacing28" mt="$spacing12">
        {/* Filtering Controls */}
        <Flex
          row
          justifyContent="space-between"
          alignItems="center"
          gap="$spacing12"
          $md={{
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '$spacing16',
          }}
        >
          <Flex row gap="$spacing12" $md={{ justifyContent: 'space-between' }}>
            {/* Transaction Type Filter */}
            <DropdownSelector
              options={transactionTypeOptions}
              selectedValue={selectedTransactionType}
              onSelect={setSelectedTransactionType}
              isOpen={filterTypeExpanded}
              toggleOpen={setFilterTypeExpanded}
              ButtonIcon={Filter}
              buttonStyle={{ width: 140, $md: { width: '100%' } }}
              containerStyle={media.md ? { flexGrow: 1 } : undefined}
              dropdownStyle={{ minWidth: DROPDOWN_MIN_WIDTH.transactionType }}
            />

            {/* Time Period Filter */}
            <DropdownSelector
              options={timePeriodOptions}
              selectedValue={selectedTimePeriod}
              onSelect={setSelectedTimePeriod}
              isOpen={timePeriodExpanded}
              toggleOpen={setTimePeriodExpanded}
              ButtonIcon={Calendar}
              buttonStyle={{ width: 140, $md: { width: '100%' } }}
              containerStyle={media.md ? { flexGrow: 1 } : undefined}
              dropdownStyle={{ minWidth: DROPDOWN_MIN_WIDTH.timePeriod }}
            />
          </Flex>

          <SearchInput
            value={searchValue}
            onChangeText={setSearchValue}
            placeholder={t('portfolio.activity.search.placeholder')}
            width={media.md ? '100%' : SEARCH_INPUT_WIDTH}
          />
        </Flex>

        <Flex>
          <ActivityTable data={transactionData} loading={loading} error={error} rowWrapper={rowWrapper} />

          {/* Show skeleton loading indicator while fetching next page */}
          {isFetchingNextPage && (
            <DataRow v2={true}>
              {[...Array(4)].map((_, index) => (
                <Cell
                  key={index}
                  loading={true}
                  justifyContent="flex-start"
                  grow
                  {...(index === 2 && { minWidth: '280px' })}
                />
              ))}
            </DataRow>
          )}

          {/* Intersection observer sentinel for infinite scroll */}
          <Flex ref={sentinelRef} height={1} my={10} />
        </Flex>

        {selectedTransaction && (
          <TransactionDetailsModal
            transactionDetails={selectedTransaction}
            onClose={handleCloseTransactionDetails}
            authTrigger={undefined}
            onReportTransaction={onReportTransaction}
            onUnhideTransaction={onUnhideTransaction}
          />
        )}
      </Flex>
    </Trace>
  )
}
