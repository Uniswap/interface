import { Table } from 'components/Table'
import { TOKENS_TABLE_ROW_HEIGHT } from 'pages/Portfolio/constants'
import { MAX_TOKENS_ROWS } from 'pages/Portfolio/Overview/constants'
import { TableSectionHeader } from 'pages/Portfolio/Overview/TableSectionHeader'
import { ViewAllButton } from 'pages/Portfolio/Overview/ViewAllButton'
import { useTransformTokenTableData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TokenColumns, useTokenColumns } from 'pages/Portfolio/Tokens/Table/columns/createTokenColumns'
import { TokensContextMenuWrapper } from 'pages/Portfolio/Tokens/Table/TokensContextMenuWrapper'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

interface MiniTokensTableProps {
  maxTokens?: number
  chainId?: UniverseChainId
}

export function MiniTokensTable({ maxTokens = 8, chainId }: MiniTokensTableProps) {
  const { t } = useTranslation()
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

  // Ensure we always have an array for the data prop
  const tableData = tokenData || []

  // Only show loading state if we don't have data yet (similar to TokensTableInner)
  const tableLoading = loading && !tokenData

  if (tableData.length === 0 && !loading) {
    return null
  }

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
                  <TokensContextMenuWrapper tokenData={row.original}>{content}</TokensContextMenuWrapper>
                )
          }
          rowHeight={TOKENS_TABLE_ROW_HEIGHT}
          compactRowHeight={TOKENS_TABLE_ROW_HEIGHT}
        />
      </TableSectionHeader>
      <ViewAllButton href="/portfolio/tokens" label={t('portfolio.overview.miniTokensTable.viewAllTokens')} />
    </Flex>
  )
}
