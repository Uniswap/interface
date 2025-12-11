import { createColumnHelper } from '@tanstack/react-table'
import { Cell } from 'components/Table/Cell'
import { HeaderCell } from 'components/Table/styled'
import { hasRow } from 'components/Table/utils/hasRow'
import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { Allocation } from 'pages/Portfolio/Tokens/Table/columns/Allocation'
import { Balance } from 'pages/Portfolio/Tokens/Table/columns/Balance'
import { ContextMenuButton } from 'pages/Portfolio/Tokens/Table/columns/ContextMenuButton'
import { Price } from 'pages/Portfolio/Tokens/Table/columns/Price'
import { RelativeChange1D } from 'pages/Portfolio/Tokens/Table/columns/RelativeChange1D'
import { TokenDisplay } from 'pages/Portfolio/Tokens/Table/columns/TokenDisplay'
import { Value } from 'pages/Portfolio/Tokens/Table/columns/Value'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'

export enum TokenColumns {
  Token = 'token',
  Price = 'price',
  Change1d = 'change1d',
  Balance = 'balance',
  Value = 'value',
  Allocation = 'allocation',
  Actions = 'actions',
}

export function useTokenColumns({
  hiddenColumns = [],
  showLoadingSkeleton,
}: {
  hiddenColumns?: TokenColumns[]
  showLoadingSkeleton: boolean
}) {
  const { t } = useTranslation()

  return useMemo(() => {
    const columnHelper = createColumnHelper<TokenData>()
    const columns = []
    const isHidden = (column: TokenColumns) => hiddenColumns.includes(column)

    if (!isHidden(TokenColumns.Token)) {
      columns.push(
        columnHelper.accessor('currencyInfo', {
          size: 240,
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
      )
    }

    if (!isHidden(TokenColumns.Price)) {
      columns.push(
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
                <Price price={info.getValue()} />
              </Cell>
            )
          },
        }),
      )
    }

    if (!isHidden(TokenColumns.Change1d)) {
      columns.push(
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
      )
    }

    if (!isHidden(TokenColumns.Balance)) {
      columns.push(
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
                <Balance balance={info.getValue()} />
              </Cell>
            )
          },
        }),
      )
    }

    if (!isHidden(TokenColumns.Value)) {
      columns.push(
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
      )
    }

    if (!isHidden(TokenColumns.Allocation)) {
      columns.push(
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
      )
    }

    if (!isHidden(TokenColumns.Actions)) {
      columns.push(
        columnHelper.display({
          id: 'actions',
          size: 48,
          header: () => <HeaderCell />,
          cell: (info) => {
            const tokenData = hasRow<TokenData>(info) ? info.row.original : undefined
            return (
              <Cell loading={showLoadingSkeleton} justifyContent="center">
                {tokenData && <ContextMenuButton key={tokenData.id} tokenData={tokenData} />}
              </Cell>
            )
          },
        }),
      )
    }

    return columns
  }, [t, showLoadingSkeleton, hiddenColumns])
}
