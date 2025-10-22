import { createColumnHelper } from '@tanstack/react-table'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { HeaderCell } from 'components/Table/styled'
import { ValueWithFadedDecimals } from 'pages/Portfolio/components/ValueWithFadedDecimals/ValueWithFadedDecimals'
import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import Allocation from 'pages/Portfolio/Tokens/Table/columns/Allocation'
import Balance from 'pages/Portfolio/Tokens/Table/columns/Balance'
import ContextMenuButton from 'pages/Portfolio/Tokens/Table/columns/ContextMenuButton'
import RelativeChange1D from 'pages/Portfolio/Tokens/Table/columns/RelativeChange1D'
import TokenDisplay from 'pages/Portfolio/Tokens/Table/columns/TokenDisplay'
import Value from 'pages/Portfolio/Tokens/Table/columns/Value'
import TokensContextMenuWrapper from 'pages/Portfolio/Tokens/Table/TokensContextMenuWrapper'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'

export default function TokensTable({ tokenData }: { tokenData: TokenData[] }) {
  const { t } = useTranslation()

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
          const currencyInfo = info.getValue()
          return (
            <Cell justifyContent="flex-start">
              <TokenDisplay currencyInfo={currencyInfo} />
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
          const value = info.getValue()
          return (
            <Cell justifyContent="flex-end">
              <ValueWithFadedDecimals value={value} />
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
          const value = info.getValue()
          return (
            <Cell justifyContent="flex-end">
              <RelativeChange1D value={value} />
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
          const value = info.getValue()
          return (
            <Cell justifyContent="flex-end">
              <Balance value={value.value} symbol={value.symbol} />
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
          const value = info.getValue()

          return (
            <Cell justifyContent="flex-end">
              <Value value={value} />
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
          const value = info.getValue()
          return (
            <Cell justifyContent="flex-end">
              <Allocation value={value} />
            </Cell>
          )
        },
      }),
      columnHelper.display({
        id: 'actions',
        size: 40,
        header: () => <HeaderCell />,
        cell: (info) => {
          const tokenData = info.row.original
          return (
            <Cell justifyContent="center">
              <ContextMenuButton tokenData={tokenData} />
            </Cell>
          )
        },
      }),
    ]
  }, [t])

  return (
    <Table
      columns={columns}
      data={tokenData}
      loading={false}
      error={false}
      v2={true}
      getRowId={(row) => row.id}
      rowWrapper={(row, content) => (
        <TokensContextMenuWrapper tokenData={row.original}>{content}</TokensContextMenuWrapper>
      )}
    />
  )
}
