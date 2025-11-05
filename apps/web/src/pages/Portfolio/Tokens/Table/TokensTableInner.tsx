import { createColumnHelper } from '@tanstack/react-table'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { HeaderCell } from 'components/Table/styled'
import { ValueWithFadedDecimals } from 'pages/Portfolio/components/ValueWithFadedDecimals/ValueWithFadedDecimals'
import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { Allocation } from 'pages/Portfolio/Tokens/Table/columns/Allocation'
import { Balance } from 'pages/Portfolio/Tokens/Table/columns/Balance'
import { ContextMenuButton } from 'pages/Portfolio/Tokens/Table/columns/ContextMenuButton'
import { RelativeChange1D } from 'pages/Portfolio/Tokens/Table/columns/RelativeChange1D'
import { TokenDisplay } from 'pages/Portfolio/Tokens/Table/columns/TokenDisplay'
import { Value } from 'pages/Portfolio/Tokens/Table/columns/Value'
import { TokensContextMenuWrapper } from 'pages/Portfolio/Tokens/Table/TokensContextMenuWrapper'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'

const hasRow = <T,>(obj: unknown): obj is { row: { original: T } } => {
  const maybeRow = (obj as { row?: unknown }).row
  return typeof maybeRow === 'object' && maybeRow !== null && 'original' in maybeRow && maybeRow.original !== undefined
}

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
  const { t } = useTranslation()
  const showLoadingSkeleton = loading || !!error

  // Create table columns
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TokenData>()

    return [
      columnHelper.accessor('currencyInfo', {
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2">
              {t('portfolio.tokens.table.column.token')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
              <TokenDisplay currencyInfo={info.getValue()} />
            </Cell>
          )
        },
      }),
      columnHelper.accessor('price', {
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <Text variant="body3" color="$neutral2">
              {t('portfolio.tokens.table.column.price')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              <ValueWithFadedDecimals value={info.getValue()} />
            </Cell>
          )
        },
      }),
      columnHelper.accessor('change1d', {
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <Text variant="body3" color="$neutral2">
              {t('portfolio.tokens.table.column.change1d')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              <RelativeChange1D value={info.getValue()} />
            </Cell>
          )
        },
      }),
      columnHelper.accessor('balance', {
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <Text variant="body3" color="$neutral2">
              {t('portfolio.tokens.table.column.balance')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              <Balance value={info.getValue().value} symbol={info.getValue().symbol} />
            </Cell>
          )
        },
      }),
      columnHelper.accessor('value', {
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <Text variant="body3" color="$neutral2">
              {t('portfolio.tokens.table.column.value')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              <Value value={info.getValue()} />
            </Cell>
          )
        },
      }),
      columnHelper.accessor('allocation', {
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <Text variant="body3" color="$neutral2">
              {t('portfolio.tokens.table.column.allocation')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              <Allocation value={info.getValue()} />
            </Cell>
          )
        },
      }),
      columnHelper.display({
        id: 'actions',
        size: 40,
        header: () => <HeaderCell />,
        cell: (info) => {
          const tokenData = hasRow<TokenData>(info) ? info.row.original : undefined
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="center">
              {tokenData && <ContextMenuButton tokenData={tokenData} />}
            </Cell>
          )
        },
      }),
    ]
  }, [t, showLoadingSkeleton])

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
    />
  )
}
