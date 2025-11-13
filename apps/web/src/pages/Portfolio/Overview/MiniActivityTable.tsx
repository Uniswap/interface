import { createColumnHelper, Row } from '@tanstack/react-table'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { hasRow } from 'components/Table/utils/hasRow'
import { ActivityAmountCell } from 'pages/Portfolio/Activity/ActivityTable/ActivityAmountCell'
import { TimeCell } from 'pages/Portfolio/Activity/ActivityTable/TimeCell'
import { filterTransactionDetailsFromActivityItems } from 'pages/Portfolio/Activity/Filters/utils'
import { ACTIVITY_TABLE_ROW_HEIGHT } from 'pages/Portfolio/constants'
import { usePortfolioAddresses } from 'pages/Portfolio/hooks/usePortfolioAddresses'
import { MAX_ACTIVITY_ROWS } from 'pages/Portfolio/Overview/constants'
import { TableSectionHeader } from 'pages/Portfolio/Overview/TableSectionHeader'
import { ViewAllButton } from 'pages/Portfolio/Overview/ViewAllButton'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, TouchableArea } from 'ui/src'
import { TransactionDetailsModal } from 'uniswap/src/components/activity/details/TransactionDetailsModal'
import { isLoadingItem } from 'uniswap/src/components/activity/utils'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ONE_DAY_MS } from 'utilities/src/time/time'
import { filterDefinedWalletAddresses } from 'utils/filterDefinedWalletAddresses'

interface MiniActivityTableProps {
  maxActivities?: number
  chainId?: UniverseChainId
}

export function MiniActivityTable({ maxActivities = 5, chainId }: MiniActivityTableProps) {
  const { t } = useTranslation()
  const { evmAddress, svmAddress } = usePortfolioAddresses()
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetails | null>(null)

  const activityData = useActivityData({
    evmOwner: evmAddress,
    svmOwner: svmAddress,
    ownerAddresses: filterDefinedWalletAddresses([evmAddress, svmAddress]),
    fiatOnRampParams: undefined,
    chainIds: chainId ? [chainId] : undefined,
  })

  // Show loading skeleton while data is being fetched
  const loading = Boolean(activityData.sectionData?.some(isLoadingItem))

  // Filter out section headers and loading items to get just transaction data from the past 7 days
  const transactionData: TransactionDetails[] = useMemo(() => {
    if (!activityData.sectionData) {
      return []
    }

    const now = Date.now()
    const sevenDaysAgo = now - 7 * ONE_DAY_MS

    return filterTransactionDetailsFromActivityItems(activityData.sectionData)
      .filter((tx) => tx.addedTime >= sevenDaysAgo)
      .slice(0, maxActivities)
  }, [activityData.sectionData, maxActivities])

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TransactionDetails>()
    const showLoadingSkeleton = loading

    return [
      // Type Column
      columnHelper.accessor((row) => row.typeInfo.type, {
        id: 'type',
        size: 240,
        cell: (info) => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
              {hasRow<TransactionDetails>(info) && (
                <ActivityAmountCell transaction={info.row.original} variant="compact" />
              )}
            </Cell>
          )
        },
      }),

      // Amount Column
      columnHelper.display({
        id: 'time',
        size: 50,
        cell: (info) => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              {hasRow<TransactionDetails>(info) && <TimeCell timestamp={info.row.original.addedTime} />}
            </Cell>
          )
        },
      }),
    ]
  }, [loading])

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

  const handleCloseTransactionDetails = useCallback(() => {
    setSelectedTransaction(null)
  }, [])

  // Ensure we always have an array for the data prop
  const tableData = transactionData

  // Only show loading state if we don't have data yet
  const tableLoading = loading && !transactionData.length

  if (tableData.length === 0 && !loading) {
    return null
  }

  return (
    <Flex gap="$gap12">
      <TableSectionHeader
        title={t('portfolio.overview.activity.table.title')}
        subtitle={t('portfolio.overview.activity.table.subtitle', {
          count: tableData.length,
        })}
        loading={loading}
      >
        <Table
          hideHeader
          columns={columns}
          data={tableData}
          loading={tableLoading}
          error={false}
          v2={true}
          rowWrapper={rowWrapper}
          loadingRowsCount={MAX_ACTIVITY_ROWS}
          rowHeight={ACTIVITY_TABLE_ROW_HEIGHT}
          compactRowHeight={ACTIVITY_TABLE_ROW_HEIGHT}
        />
      </TableSectionHeader>
      <ViewAllButton href="/portfolio/activity" label={t('portfolio.overview.activity.table.viewAllActivity')} />
      {selectedTransaction && (
        <TransactionDetailsModal
          transactionDetails={selectedTransaction}
          onClose={handleCloseTransactionDetails}
          authTrigger={undefined}
        />
      )}
    </Flex>
  )
}
