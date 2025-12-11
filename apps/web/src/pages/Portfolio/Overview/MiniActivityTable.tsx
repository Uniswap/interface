import { createColumnHelper, Row } from '@tanstack/react-table'
import { SharedEventName } from '@uniswap/analytics-events'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { hasRow } from 'components/Table/utils/hasRow'
import { ActivityAmountCell } from 'pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/ActivityAmountCell'
import { TimeCell } from 'pages/Portfolio/Activity/ActivityTable/TimeCell'
import { filterTransactionDetailsFromActivityItems } from 'pages/Portfolio/Activity/Filters/utils'
import { PORTFOLIO_TABLE_ROW_HEIGHT } from 'pages/Portfolio/constants'
import { usePortfolioRoutes } from 'pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { MAX_ACTIVITY_ROWS } from 'pages/Portfolio/Overview/constants'
import { TableSectionHeader } from 'pages/Portfolio/Overview/TableSectionHeader'
import { ViewAllButton } from 'pages/Portfolio/Overview/ViewAllButton'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, Text, TouchableArea } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { RotateRight } from 'ui/src/components/icons/RotateRight'
import { TransactionDetailsModal } from 'uniswap/src/components/activity/details/TransactionDetailsModal'
import { isLoadingItem } from 'uniswap/src/components/activity/utils'
import { ActivityRenderData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { ONE_DAY_MS } from 'utilities/src/time/time'

interface MiniActivityTableProps {
  maxActivities?: number
  activityData: ActivityRenderData
}

export const MiniActivityTable = memo(function MiniActivityTable({
  maxActivities = 5,
  activityData,
}: MiniActivityTableProps) {
  const { t } = useTranslation()
  const trace = useTrace()
  const { chainId } = usePortfolioRoutes()
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetails | null>(null)
  const navigate = useNavigate()

  // Show loading skeleton while data is being fetched
  const loading = Boolean(activityData.sectionData?.some(isLoadingItem))

  // Filter out section headers and loading items to get just transaction data from the past 7 days
  const { transactionData, showingPastWeek } = useMemo(() => {
    if (!activityData.sectionData) {
      return { transactionData: [], showingPastWeek: true }
    }

    const now = Date.now()
    const sevenDaysAgo = now - 7 * ONE_DAY_MS

    const filteredTransactionDetails = filterTransactionDetailsFromActivityItems(activityData.sectionData)
    const thisWeekTransactions = filteredTransactionDetails.filter((tx) => tx.addedTime >= sevenDaysAgo)

    // If there are no transactions this week, show the 5 most recent transactions
    if (thisWeekTransactions.length === 0) {
      return {
        transactionData: filteredTransactionDetails.slice(0, maxActivities),
        showingPastWeek: false,
      }
    }
    return {
      transactionData: thisWeekTransactions,
      showingPastWeek: true,
    }
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
        minSize: 100,
        size: 100,
        meta: {
          flexGrow: 0,
        },
        cell: (info) => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              {hasRow<TransactionDetails>(info) && (
                <TimeCell timestamp={info.row.original.addedTime} textAlign="right" />
              )}
            </Cell>
          )
        },
      }),
    ]
  }, [loading])

  const handleTransactionClick = useCallback(
    (transaction: TransactionDetails) => {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.PortfolioMiniActivityRow,
        section: SectionName.PortfolioOverviewTab,
        ...trace,
      })
      setSelectedTransaction(transaction)
    },
    [trace],
  )

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

  const handleSeeAllActivity = useCallback(() => {
    navigate('/portfolio/activity')
  }, [navigate])

  // Only show loading state if we don't have data yet
  const tableLoading = loading && !transactionData.length

  const subtitle = useMemo(() => {
    if (showingPastWeek) {
      return t('portfolio.overview.activity.table.subtitle', { count: transactionData.length })
    }
    return t('portfolio.overview.activity.table.subtitle_most_recent', { count: transactionData.length })
  }, [showingPastWeek, transactionData.length, t])

  return (
    <Flex gap="$gap12">
      <TableSectionHeader
        title={
          transactionData.length > 0
            ? t('portfolio.overview.activity.table.title')
            : t('portfolio.overview.activity.table.title.noRecentActivity')
        }
        subtitle={subtitle}
        loading={loading}
      >
        {transactionData.length > 0 ? (
          <Table
            hideHeader
            columns={columns}
            data={transactionData.slice(0, maxActivities)}
            loading={tableLoading}
            error={false}
            v2={true}
            rowWrapper={rowWrapper}
            loadingRowsCount={MAX_ACTIVITY_ROWS}
            rowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
            compactRowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
          />
        ) : (
          <Flex row alignItems="center" height={PORTFOLIO_TABLE_ROW_HEIGHT} gap="$gap8">
            <InfoCircleFilled color="$neutral2" size="$icon.20" />
            <Text variant="buttonLabel3" color="$neutral1">
              {t('portfolio.overview.activity.table.empty', { count: transactionData.length })}
            </Text>
          </Flex>
        )}
      </TableSectionHeader>
      {chainId && transactionData.length === 0 ? (
        <TouchableArea row alignItems="center" gap="$gap8" onPress={handleSeeAllActivity}>
          <Text variant="body3" color="$neutral2">
            {t('portfolio.overview.activity.seeAllActivity')}
          </Text>
          <RotateRight color="$neutral1" size="$icon.16" />
        </TouchableArea>
      ) : (
        <ViewAllButton
          href="/portfolio/activity"
          label={t('portfolio.overview.activity.table.viewAllActivity')}
          elementName={ElementName.PortfolioViewAllActivity}
        />
      )}
      {selectedTransaction && (
        <TransactionDetailsModal
          transactionDetails={selectedTransaction}
          onClose={handleCloseTransactionDetails}
          authTrigger={undefined}
        />
      )}
    </Flex>
  )
})
