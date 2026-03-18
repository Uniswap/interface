import { createColumnHelper } from '@tanstack/react-table'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AnglesDownUp } from 'ui/src/components/icons/AnglesDownUp'
import { SortVertical } from 'ui/src/components/icons/SortVertical'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { Cell } from '~/components/Table/Cell'
import { HeaderCell } from '~/components/Table/styled'
import { hasRow } from '~/components/Table/utils/hasRow'
import { EmptyTableCell } from '~/pages/Portfolio/EmptyTableCell'
import { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { Allocation } from '~/pages/Portfolio/Tokens/Table/columns/Allocation'
import { Balance } from '~/pages/Portfolio/Tokens/Table/columns/Balance'
import { ContextMenuButton } from '~/pages/Portfolio/Tokens/Table/columns/ContextMenuButton'
import { Price } from '~/pages/Portfolio/Tokens/Table/columns/Price'
import { RelativeChange1D } from '~/pages/Portfolio/Tokens/Table/columns/RelativeChange1D'
import { TokenDisplay } from '~/pages/Portfolio/Tokens/Table/columns/TokenDisplay'
import { Value } from '~/pages/Portfolio/Tokens/Table/columns/Value'
import type { TokenTableRow } from '~/pages/Portfolio/Tokens/Table/tokenTableRowUtils'
import { getTokenDataForRow } from '~/pages/Portfolio/Tokens/Table/tokenTableRowUtils'

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
  const multichainExpandable = useFeatureFlag(FeatureFlags.MultichainTokenUx)

  return useMemo(() => {
    const columnHelper = createColumnHelper<TokenTableRow>()
    const columns = []
    const isHidden = (column: TokenColumns) => hiddenColumns.includes(column)

    if (!isHidden(TokenColumns.Token)) {
      columns.push(
        columnHelper.accessor((row) => (row.type === 'parent' ? row.tokenData.currencyInfo : row.chainToken.chainId), {
          id: 'currencyInfo',
          size: 240,
          header: () => (
            <HeaderCell justifyContent="flex-start">
              <Text variant="body3" color="$neutral2">
                {t('portfolio.tokens.table.column.token')}
              </Text>
            </HeaderCell>
          ),
          cell: (info) => {
            const row = hasRow<TokenTableRow>(info) ? info.row.original : null
            if (!row) {
              return (
                <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
                  <EmptyTableCell />
                </Cell>
              )
            }
            return (
              <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
                {row.type === 'parent' ? (
                  <TokenDisplay
                    currencyInfo={row.tokenData.currencyInfo}
                    chainIds={row.tokenData.tokens.map((t) => t.chainId)}
                  />
                ) : (
                  <Flex row alignItems="center" gap="$spacing8" ml="$spacing40">
                    <NetworkLogo chainId={row.chainToken.chainId} size={iconSizes.icon20} />
                    <Text variant="body3">{getChainLabel(row.chainToken.chainId)}</Text>
                  </Flex>
                )}
              </Cell>
            )
          },
        }),
      )
    }

    if (!isHidden(TokenColumns.Price)) {
      columns.push(
        columnHelper.accessor((row) => (row.type === 'parent' ? row.tokenData.price : null), {
          id: 'price',
          header: () => (
            <HeaderCell justifyContent="flex-end">
              <Text variant="body3" color="$neutral2">
                {t('portfolio.tokens.table.column.price')}
              </Text>
            </HeaderCell>
          ),
          cell: (info) => {
            const row = hasRow<TokenTableRow>(info) ? info.row.original : null
            return (
              <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
                {row && row.type === 'parent' && <Price price={row.tokenData.price} />}
              </Cell>
            )
          },
        }),
      )
    }

    if (!isHidden(TokenColumns.Change1d)) {
      columns.push(
        columnHelper.accessor((row) => (row.type === 'parent' ? row.tokenData.change1d : null), {
          id: 'change1d',
          header: () => (
            <HeaderCell justifyContent="flex-end">
              <Text variant="body3" color="$neutral2">
                {t('portfolio.tokens.table.column.change1d')}
              </Text>
            </HeaderCell>
          ),
          cell: (info) => {
            const row = hasRow<TokenTableRow>(info) ? info.row.original : null
            return (
              <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
                {row && row.type === 'parent' && <RelativeChange1D value={row.tokenData.change1d} />}
              </Cell>
            )
          },
        }),
      )
    }

    if (!isHidden(TokenColumns.Balance)) {
      columns.push(
        columnHelper.accessor(
          (row): Pick<TokenData, 'quantity' | 'symbol'> =>
            row.type === 'parent'
              ? { quantity: row.tokenData.quantity, symbol: row.tokenData.symbol }
              : { quantity: row.chainToken.quantity, symbol: row.chainToken.symbol },
          {
            id: 'balance',
            header: () => (
              <HeaderCell justifyContent="flex-end">
                <Text variant="body3" color="$neutral2">
                  {t('portfolio.tokens.table.column.balance')}
                </Text>
              </HeaderCell>
            ),
            cell: (info) => {
              const row = hasRow<TokenTableRow>(info) ? info.row.original : null
              /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
              const balance = info.getValue?.()
              if (!row) {
                return (
                  <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
                    <EmptyTableCell />
                  </Cell>
                )
              }
              const isChild = row.type === 'child'
              return (
                <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
                  <Balance balance={balance} color={isChild ? '$neutral2' : undefined} />
                </Cell>
              )
            },
          },
        ),
      )
    }

    if (!isHidden(TokenColumns.Value)) {
      columns.push(
        columnHelper.accessor((row) => (row.type === 'parent' ? row.tokenData.totalValue : row.chainToken.valueUsd), {
          id: 'totalValue',
          header: () => (
            <HeaderCell justifyContent="flex-end">
              <Text variant="body3" color="$neutral2">
                {t('portfolio.tokens.table.column.value')}
              </Text>
            </HeaderCell>
          ),
          cell: (info) => {
            const row = hasRow<TokenTableRow>(info) ? info.row.original : null
            /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
            const value = info.getValue?.()
            if (!row) {
              return (
                <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
                  <EmptyTableCell />
                </Cell>
              )
            }
            const isChild = row.type === 'child'
            return (
              <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
                {isChild ? (
                  <Text color="$neutral2">
                    <Value value={value} />
                  </Text>
                ) : (
                  <Value value={value} />
                )}
              </Cell>
            )
          },
        }),
      )
    }

    if (!isHidden(TokenColumns.Allocation)) {
      columns.push(
        columnHelper.accessor((row) => (row.type === 'parent' ? row.tokenData.allocation : null), {
          id: 'allocation',
          header: () => (
            <HeaderCell justifyContent="flex-end">
              <Text variant="body3" color="$neutral2">
                {t('portfolio.tokens.table.column.allocation')}
              </Text>
            </HeaderCell>
          ),
          cell: (info) => {
            const row = hasRow<TokenTableRow>(info) ? info.row.original : null
            return (
              <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
                {row && row.type === 'parent' && <Allocation value={row.tokenData.allocation} />}
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
            const row = hasRow<TokenTableRow>(info) ? info.row.original : null
            const tableRow = hasRow<TokenTableRow>(info) ? info.row : null
            if (!row) {
              return (
                <Cell loading={showLoadingSkeleton} justifyContent="center">
                  <EmptyTableCell />
                </Cell>
              )
            }
            const canExpand = multichainExpandable && tableRow?.getCanExpand()
            if (row.type === 'parent' && canExpand) {
              const isExpanded = tableRow?.getIsExpanded() ?? false
              return (
                <Cell
                  key={`expand-${tableRow?.id ?? row.tokenData.id}`}
                  loading={showLoadingSkeleton}
                  justifyContent="center"
                >
                  <TouchableArea
                    onPress={(e) => {
                      e.stopPropagation()
                      tableRow?.toggleExpanded()
                    }}
                    hitSlop={8}
                  >
                    {isExpanded ? (
                      <AnglesDownUp color="$neutral2" size="$icon.16" />
                    ) : (
                      <SortVertical color="$neutral2" size="$icon.16" />
                    )}
                  </TouchableArea>
                </Cell>
              )
            }
            const tokenDataForMenu = getTokenDataForRow(row)
            return (
              <Cell loading={showLoadingSkeleton} justifyContent="center">
                <ContextMenuButton key={tokenDataForMenu.id} tokenData={tokenDataForMenu} />
              </Cell>
            )
          },
        }),
      )
    }

    return columns
  }, [t, showLoadingSkeleton, hiddenColumns, multichainExpandable])
}
