import { SharedEventName } from '@uniswap/analytics-events'
import { Table } from 'components/Table'
import { PORTFOLIO_TABLE_ROW_HEIGHT } from 'pages/Portfolio/constants'
import { MAX_TOKENS_ROWS } from 'pages/Portfolio/Overview/constants'
import { TableSectionHeader } from 'pages/Portfolio/Overview/TableSectionHeader'
import { ViewAllButton } from 'pages/Portfolio/Overview/ViewAllButton'
import { useNavigateToTokenDetails } from 'pages/Portfolio/Tokens/hooks/useNavigateToTokenDetails'
import { TokenData, useTransformTokenTableData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TokenColumns, useTokenColumns } from 'pages/Portfolio/Tokens/Table/columns/useTokenColumns'
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, TouchableArea } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const TOKENS_TABLE_MAX_HEIGHT = 800
const TOKENS_TABLE_MAX_WIDTH = 1200

interface MiniTokensTableProps {
  maxTokens?: number
  chainId?: UniverseChainId
}

export const MiniTokensTable = memo(function MiniTokensTable({ maxTokens = 8, chainId }: MiniTokensTableProps) {
  const { t } = useTranslation()
  const trace = useTrace()

  // Get token data with limit applied at the hook level
  const {
    visible: tokenData,
    totalCount,
    loading,
    error,
  } = useTransformTokenTableData({
    limit: maxTokens,
    chainIds: chainId ? [chainId] : undefined,
  })

  // Create table columns with only the specified columns: Token, Price, Balance, Value, Actions
  const columns = useTokenColumns({
    hiddenColumns: [TokenColumns.Change1d, TokenColumns.Allocation],
    showLoadingSkeleton: loading || !!error,
  })

  const navigateToTokenDetails = useNavigateToTokenDetails()

  const handleTokenRowClick = useCallback(
    (tokenData: TokenData) => {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.PortfolioMiniTokenRow,
        section: SectionName.PortfolioOverviewTab,
        ...trace,
      })
      navigateToTokenDetails(tokenData)
    },
    [navigateToTokenDetails, trace],
  )

  // Ensure we always have an array for the data prop
  const tableData = tokenData || []

  // Only show loading state if we don't have data yet (similar to TokensTableInner)
  const tableLoading = loading && !tokenData

  return (
    <Flex grow gap="$gap12">
      <TableSectionHeader
        title={t('common.tokens')}
        subtitle={t('portfolio.tokens.balance.totalTokens', { count: totalCount ?? tableData.length })}
        loading={tableLoading}
      >
        <Table
          columns={columns}
          data={tableData}
          loading={tableLoading}
          error={!!error}
          v2={true}
          getRowId={(row) => row.id}
          loadingRowsCount={MAX_TOKENS_ROWS}
          rowWrapper={
            tableLoading
              ? undefined
              : (row, content) => (
                  <TouchableArea onPress={() => handleTokenRowClick(row.original)}>{content}</TouchableArea>
                )
          }
          rowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
          compactRowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
          defaultPinnedColumns={['currencyInfo']}
          maxWidth={TOKENS_TABLE_MAX_WIDTH}
          centerArrows
          maxHeight={TOKENS_TABLE_MAX_HEIGHT}
        />
      </TableSectionHeader>
      <ViewAllButton
        href="/portfolio/tokens"
        label={t('portfolio.overview.miniTokensTable.viewAllTokens')}
        elementName={ElementName.PortfolioViewAllTokens}
      />
    </Flex>
  )
})
