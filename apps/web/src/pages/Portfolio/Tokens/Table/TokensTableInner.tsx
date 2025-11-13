import { Table } from 'components/Table'
import { TOKENS_TABLE_ROW_HEIGHT } from 'pages/Portfolio/constants'
import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { useTokenColumns } from 'pages/Portfolio/Tokens/Table/columns/createTokenColumns'
import { TokensContextMenuWrapper } from 'pages/Portfolio/Tokens/Table/TokensContextMenuWrapper'

export function TokensTableInner({
  tokenData,
  hideHeader,
  loading = false,
  error,
}: {
  tokenData: TokenData[]
  hideHeader?: boolean
  loading?: boolean
  error?: Error | undefined
}) {
  const showLoadingSkeleton = loading || !!error

  // Create table columns using the shared hook with default config (all columns shown)
  const columns = useTokenColumns({ showLoadingSkeleton })

  return (
    <Table
      columns={columns}
      data={tokenData}
      loading={loading}
      error={!!error}
      v2={true}
      hideHeader={hideHeader}
      externalScrollSync
      scrollGroup="portfolio-tokens"
      getRowId={(row) => row.id}
      rowWrapper={
        loading
          ? undefined
          : (row, content) => <TokensContextMenuWrapper tokenData={row.original}>{content}</TokensContextMenuWrapper>
      }
      rowHeight={TOKENS_TABLE_ROW_HEIGHT}
      compactRowHeight={TOKENS_TABLE_ROW_HEIGHT}
    />
  )
}
