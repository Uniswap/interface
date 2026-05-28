import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { OrderDirection } from '~/appGraphql/data/util'
import { Cell } from '~/components/Table/Cell'
import { HeaderCell } from '~/components/Table/styled'
import { hasRow } from '~/components/Table/utils/hasRow'
import { EmptyTableCell } from '~/pages/Portfolio/EmptyTableCell'
import { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { Allocation } from '~/pages/Portfolio/Tokens/Table/columns/Allocation'
import { AvgCost } from '~/pages/Portfolio/Tokens/Table/columns/AvgCost'
import { Balance } from '~/pages/Portfolio/Tokens/Table/columns/Balance'
import { ContextMenuButton } from '~/pages/Portfolio/Tokens/Table/columns/ContextMenuButton'
import { Price } from '~/pages/Portfolio/Tokens/Table/columns/Price'
import { RelativeChange1D } from '~/pages/Portfolio/Tokens/Table/columns/RelativeChange1D'
import { TokenDisplay } from '~/pages/Portfolio/Tokens/Table/columns/TokenDisplay'
import { UnrealizedPnl } from '~/pages/Portfolio/Tokens/Table/columns/UnrealizedPnl'
import { Value } from '~/pages/Portfolio/Tokens/Table/columns/Value'
import {
  getPortfolioTokenColumnHeaderLabel,
  PortfolioTokenTableHeader,
} from '~/pages/Portfolio/Tokens/Table/PortfolioTokenTableHeader'
import {
  PortfolioTokenSortMethod,
  usePortfolioTokenTableSortStore,
} from '~/pages/Portfolio/Tokens/Table/portfolioTokenTableSortStore'
import {
  type TokenTableRow,
  getTokenDataForRow,
  isStablecoinForChainToken,
} from '~/pages/Portfolio/Tokens/Table/tokenTableRowUtils'

export enum TokenColumns {
  Token = 'token',
  // oxlint-disable-next-line no-shadow
  Price = 'price',
  // oxlint-disable-next-line no-shadow
  AvgCost = 'avgCost',
  Change1d = 'change1d',
  // oxlint-disable-next-line no-shadow
  Balance = 'balance',
  // oxlint-disable-next-line no-shadow
  Value = 'value',
  // oxlint-disable-next-line no-shadow
  UnrealizedPnl = 'unrealizedPnl',
  // oxlint-disable-next-line no-shadow
  Allocation = 'allocation',
  Actions = 'actions',
}

export function useTokenColumns({
  hiddenColumns = [],
  showLoadingSkeleton,
  showUnrealizedPnlPercent = false,
  columnSortEnabled = true,
}: {
  hiddenColumns?: TokenColumns[]
  showLoadingSkeleton: boolean
  showUnrealizedPnlPercent?: boolean
  /** When false, column headers are non-interactive (e.g. overview mini table). */
  columnSortEnabled?: boolean
}) {
  const { t } = useTranslation()

  const { sortMethod, sortAscending } = usePortfolioTokenTableSortStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc

  return useMemo(() => {
    const columnHelper = createColumnHelper<TokenTableRow>()
    const columns = []
    const isHidden = (column: TokenColumns) => hiddenColumns.includes(column)

    if (!isHidden(TokenColumns.Token)) {
      columns.push(
        columnHelper.accessor((row) => (row.type === 'parent' ? row.tokenData.currencyInfo : row.chainToken.chainId), {
          id: 'currencyInfo',
          size: 180,
          header: () => (
            <HeaderCell justifyContent="flex-start">
              <Text variant="body3" color="$neutral2">
                {t('portfolio.tokens.table.column.token')}
              </Text>
            </HeaderCell>
          ),
          cell: (info) => {
            const row = hasRow<TokenTableRow>(info) ? info.row.original : null
            const tableRow = hasRow<TokenTableRow>(info) ? info.row : null
            if (!row) {
              return (
                <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
                  <EmptyTableCell />
                </Cell>
              )
            }
            const isExpanded = tableRow?.getIsExpanded() ?? false
            return (
              <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
                {row.type === 'parent' ? (
                  <TokenDisplay
                    currencyInfo={row.tokenData.currencyInfo}
                    displayName={row.tokenData.name}
                    displaySymbol={row.tokenData.symbol}
                    // oxlint-disable-next-line no-shadow
                    chainIds={row.tokenData.tokens.map((t) => t.chainId)}
                    isExpanded={isExpanded}
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
          size: 120,
          header: () => (
            <HeaderCell justifyContent="flex-end">
              {columnSortEnabled ? (
                <PortfolioTokenTableHeader
                  category={PortfolioTokenSortMethod.PRICE}
                  isCurrentSortMethod={sortMethod === PortfolioTokenSortMethod.PRICE}
                  direction={orderDirection}
                />
              ) : (
                <Text variant="body3" color="$neutral2">
                  {getPortfolioTokenColumnHeaderLabel(t, PortfolioTokenSortMethod.PRICE)}
                </Text>
              )}
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

    if (!isHidden(TokenColumns.AvgCost)) {
      columns.push(
        columnHelper.accessor(
          (row) => (row.type === 'parent' ? row.tokenData.avgCost : (row.chainToken.avgCost ?? null)),
          {
            id: 'avgCost',
            size: 120,
            header: () => (
              <HeaderCell justifyContent="flex-end">
                {columnSortEnabled ? (
                  <PortfolioTokenTableHeader
                    category={PortfolioTokenSortMethod.AVG_COST}
                    isCurrentSortMethod={sortMethod === PortfolioTokenSortMethod.AVG_COST}
                    direction={orderDirection}
                  />
                ) : (
                  <Text variant="body3" color="$neutral2">
                    {getPortfolioTokenColumnHeaderLabel(t, PortfolioTokenSortMethod.AVG_COST)}
                  </Text>
                )}
              </HeaderCell>
            ),
            cell: (info) => {
              const row = hasRow<TokenTableRow>(info) ? info.row.original : null
              if (!row) {
                return (
                  <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
                    <EmptyTableCell />
                  </Cell>
                )
              }
              const value = row.type === 'parent' ? row.tokenData.avgCost : row.chainToken.avgCost
              return (
                <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
                  <AvgCost value={value} />
                </Cell>
              )
            },
          },
        ),
      )
    }

    if (!isHidden(TokenColumns.Change1d)) {
      columns.push(
        columnHelper.accessor((row) => (row.type === 'parent' ? row.tokenData.change1d : null), {
          id: 'change1d',
          size: 120,
          header: () => (
            <HeaderCell justifyContent="flex-end">
              {columnSortEnabled ? (
                <PortfolioTokenTableHeader
                  category={PortfolioTokenSortMethod.CHANGE_1D}
                  isCurrentSortMethod={sortMethod === PortfolioTokenSortMethod.CHANGE_1D}
                  direction={orderDirection}
                />
              ) : (
                <Text variant="body3" color="$neutral2">
                  {getPortfolioTokenColumnHeaderLabel(t, PortfolioTokenSortMethod.CHANGE_1D)}
                </Text>
              )}
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
            size: 120,
            header: () => (
              <HeaderCell justifyContent="flex-end">
                {columnSortEnabled ? (
                  <PortfolioTokenTableHeader
                    category={PortfolioTokenSortMethod.BALANCE}
                    isCurrentSortMethod={sortMethod === PortfolioTokenSortMethod.BALANCE}
                    direction={orderDirection}
                  />
                ) : (
                  <Text variant="body3" color="$neutral2">
                    {getPortfolioTokenColumnHeaderLabel(t, PortfolioTokenSortMethod.BALANCE)}
                  </Text>
                )}
              </HeaderCell>
            ),
            cell: (info) => {
              const row = hasRow<TokenTableRow>(info) ? info.row.original : null

              // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
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
          size: 120,
          header: () => (
            <HeaderCell justifyContent="flex-end">
              {columnSortEnabled ? (
                <PortfolioTokenTableHeader
                  category={PortfolioTokenSortMethod.VALUE}
                  isCurrentSortMethod={sortMethod === PortfolioTokenSortMethod.VALUE}
                  direction={orderDirection}
                />
              ) : (
                <Text variant="body3" color="$neutral2">
                  {getPortfolioTokenColumnHeaderLabel(t, PortfolioTokenSortMethod.VALUE)}
                </Text>
              )}
            </HeaderCell>
          ),
          cell: (info) => {
            const row = hasRow<TokenTableRow>(info) ? info.row.original : null

            // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
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

    if (!isHidden(TokenColumns.UnrealizedPnl)) {
      columns.push(
        columnHelper.accessor(
          (row) => (row.type === 'parent' ? row.tokenData.unrealizedPnl : (row.chainToken.unrealizedPnl ?? null)),
          {
            id: 'unrealizedPnl',
            size: 160,
            header: () => (
              <HeaderCell justifyContent="flex-end">
                {columnSortEnabled ? (
                  <PortfolioTokenTableHeader
                    category={PortfolioTokenSortMethod.UNREALIZED_PNL}
                    isCurrentSortMethod={sortMethod === PortfolioTokenSortMethod.UNREALIZED_PNL}
                    direction={orderDirection}
                  />
                ) : (
                  <Text variant="body3" color="$neutral2">
                    {getPortfolioTokenColumnHeaderLabel(t, PortfolioTokenSortMethod.UNREALIZED_PNL)}
                  </Text>
                )}
              </HeaderCell>
            ),
            cell: (info) => {
              const row = hasRow<TokenTableRow>(info) ? info.row.original : null
              if (!row) {
                return (
                  <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
                    <EmptyTableCell />
                  </Cell>
                )
              }
              if (row.type === 'parent') {
                return (
                  <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
                    <UnrealizedPnl
                      value={row.tokenData.unrealizedPnl}
                      percent={row.tokenData.unrealizedPnlPercent}
                      isStablecoin={row.tokenData.isStablecoin}
                      showPercent={showUnrealizedPnlPercent}
                    />
                  </Cell>
                )
              }
              if (row.chainToken.unrealizedPnl === undefined) {
                return <Cell loading={showLoadingSkeleton} />
              }
              return (
                <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
                  <UnrealizedPnl
                    value={row.chainToken.unrealizedPnl}
                    percent={row.chainToken.unrealizedPnlPercent}
                    isStablecoin={isStablecoinForChainToken(row.chainToken)}
                    showPercent={showUnrealizedPnlPercent}
                  />
                </Cell>
              )
            },
          },
        ),
      )
    }

    if (!isHidden(TokenColumns.Allocation)) {
      columns.push(
        columnHelper.accessor((row) => (row.type === 'parent' ? row.tokenData.allocation : null), {
          id: 'allocation',
          size: 130,
          header: () => (
            <HeaderCell justifyContent="flex-end">
              {columnSortEnabled ? (
                <PortfolioTokenTableHeader
                  category={PortfolioTokenSortMethod.ALLOCATION}
                  isCurrentSortMethod={sortMethod === PortfolioTokenSortMethod.ALLOCATION}
                  direction={orderDirection}
                />
              ) : (
                <Text variant="body3" color="$neutral2">
                  {getPortfolioTokenColumnHeaderLabel(t, PortfolioTokenSortMethod.ALLOCATION)}
                </Text>
              )}
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
            if (!row) {
              return (
                <Cell loading={showLoadingSkeleton} justifyContent="center">
                  <EmptyTableCell />
                </Cell>
              )
            }
            if (row.type === 'parent') {
              return (
                <Cell loading={showLoadingSkeleton} justifyContent="center">
                  <ContextMenuButton key={row.tokenData.id} tokenData={row.tokenData} />
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
  }, [t, showLoadingSkeleton, hiddenColumns, showUnrealizedPnlPercent, sortMethod, orderDirection, columnSortEnabled])
}
