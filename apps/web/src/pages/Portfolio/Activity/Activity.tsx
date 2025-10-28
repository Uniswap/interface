import { Row } from '@tanstack/react-table'
import { ActivityTable } from 'components/ActivityTable/ActivityTable'
import { DropdownSelector } from 'components/Dropdowns/DropdownSelector'
import {
  getTimePeriodFilterOptions,
  getTransactionTypeFilterOptions,
  getTransactionTypesForFilter,
} from 'pages/Portfolio/Activity/Filters/utils'
import { SearchInput } from 'pages/Portfolio/components/SearchInput'
import { usePortfolioAddress } from 'pages/Portfolio/hooks/usePortfolioAddress'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, TouchableArea } from 'ui/src'
import { Calendar } from 'ui/src/components/icons/Calendar'
import { Filter } from 'ui/src/components/icons/Filter'
import { TransactionDetailsModal } from 'uniswap/src/components/activity/details/TransactionDetailsModal'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { isLoadingItem, isSectionHeader } from 'uniswap/src/components/activity/utils'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ONE_DAY_MS } from 'utilities/src/time/time'

const DROPDOWN_MIN_WIDTH = {
  transactionType: 220,
  timePeriod: 200,
}

const PAGE_SIZE = 50

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

  // Filter out loading items and section headers, leaving only TransactionDetails
  const transactionItems = transactions.filter(
    (item): item is TransactionDetails => !isLoadingItem(item) && !isSectionHeader(item),
  )

  return transactionItems
    .filter((tx) => allowedTypes === 'all' || allowedTypes.includes(tx.typeInfo.type))
    .filter((tx) => isWithinTimePeriod(tx.addedTime, timeFilter))
}

export default function PortfolioActivity() {
  const { t } = useTranslation()
  const transactionTypeOptions = getTransactionTypeFilterOptions(t)
  const timePeriodOptions = getTimePeriodFilterOptions(t)
  const [selectedTransactionType, setSelectedTransactionType] = useState('all')
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('all')
  const [searchValue, setSearchValue] = useState('')
  const [filterTypeExpanded, setFilterTypeExpanded] = useState(false)
  const [timePeriodExpanded, setTimePeriodExpanded] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetails | null>(null)

  const portfolioAddress = usePortfolioAddress()

  const activityData = useActivityData({
    evmOwner: portfolioAddress,
    ownerAddresses: [portfolioAddress],
    swapCallbacks: {
      useLatestSwapTransaction: () => undefined,
      useSwapFormTransactionState: () => undefined,
      onRetryGenerator: () => () => {},
    },
    fiatOnRampParams: undefined,
  })

  // Show loading skeleton while data is being fetched (sectionData contains loading items when loading)
  const loading = Boolean(activityData.sectionData?.some(isLoadingItem))

  // Filter out section headers and loading items to get just transaction data
  const transactionData: TransactionDetails[] = useMemo(
    () =>
      filterTransactions({
        transactions: activityData.sectionData || [],
        typeFilter: selectedTransactionType,
        timeFilter: selectedTimePeriod,
      }).slice(0, PAGE_SIZE), // TODO: add infinite scroll once that stack gets merged
    [activityData.sectionData, selectedTransactionType, selectedTimePeriod],
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

  return (
    <Trace logImpression page={InterfacePageName.PortfolioActivityPage}>
      <Flex gap="$spacing40">
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
              buttonStyle={{ minWidth: 200 }}
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
              dropdownStyle={{ minWidth: DROPDOWN_MIN_WIDTH.timePeriod }}
            />
          </Flex>

          <SearchInput value={searchValue} onChangeText={setSearchValue} placeholder="Search activity" width={280} />
        </Flex>

        <ActivityTable data={transactionData} loading={loading} error={error} rowWrapper={rowWrapper} />

        {selectedTransaction && (
          <TransactionDetailsModal
            transactionDetails={selectedTransaction}
            onClose={handleCloseTransactionDetails}
            authTrigger={undefined}
          />
        )}
      </Flex>
    </Trace>
  )
}
