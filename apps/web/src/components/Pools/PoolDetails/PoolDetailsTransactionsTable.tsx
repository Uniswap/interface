import { Trans } from '@lingui/macro'
import { createColumnHelper } from '@tanstack/react-table'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { Filter } from 'components/Table/Filter'
import {
  ClickableHeaderRow,
  FilterHeaderRow,
  HeaderArrow,
  HeaderSortText,
  TimestampCell,
} from 'components/Table/styled'
import { supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { PoolTransaction, PoolTransactionType, usePoolTransactions } from 'graphql/thegraph/PoolTransactions'
import { OrderDirection, Token, Transaction_OrderBy } from 'graphql/thegraph/__generated__/types-and-hooks'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useCallback, useMemo, useReducer, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { ExternalLink, StyledInternalLink, ThemedText } from 'theme/components'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const StyledExternalLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.neutral2};
  stroke: ${({ theme }) => theme.neutral2};
`

type PoolTxTableSortState = {
  sortBy: Transaction_OrderBy
  sortDirection: OrderDirection
}

enum PoolTransactionColumn {
  Timestamp,
  Type,
  MakerAddress,
  FiatValue,
  InputAmount,
  OutputAmount,
}

const PoolTransactionColumnWidth: { [key in PoolTransactionColumn]: number } = {
  [PoolTransactionColumn.Timestamp]: 164,
  [PoolTransactionColumn.Type]: 100,
  [PoolTransactionColumn.MakerAddress]: 100,
  [PoolTransactionColumn.FiatValue]: 125,
  [PoolTransactionColumn.InputAmount]: 125,
  [PoolTransactionColumn.OutputAmount]: 125,
}

export function PoolDetailsTransactionsTable({
  poolAddress,
  token0,
  token1,
}: {
  poolAddress: string
  token0?: Token
  token1?: Token
}) {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  const activeLocalCurrency = useActiveLocalCurrency()
  const { formatNumber, formatFiatPrice } = useFormatter()
  const [filterModalIsOpen, toggleFilterModal] = useReducer((s) => !s, false)
  const [filter, setFilters] = useState<PoolTransactionType[]>([
    PoolTransactionType.BUY,
    PoolTransactionType.SELL,
    PoolTransactionType.BURN,
    PoolTransactionType.MINT,
  ])

  const [sortState, setSortMethod] = useState<PoolTxTableSortState>({
    sortBy: Transaction_OrderBy.Timestamp,
    sortDirection: OrderDirection.Desc,
  })
  const { transactions, loading, loadMore, error } = usePoolTransactions(
    poolAddress,
    chainId,
    sortState.sortBy,
    sortState.sortDirection,
    filter,
    token0
  )

  const handleHeaderClick = useCallback(
    (newSortMethod: Transaction_OrderBy) => {
      if (sortState.sortBy === newSortMethod) {
        setSortMethod({
          sortBy: newSortMethod,
          sortDirection: sortState.sortDirection === OrderDirection.Asc ? OrderDirection.Desc : OrderDirection.Asc,
        })
      } else {
        setSortMethod({
          sortBy: newSortMethod,
          sortDirection: OrderDirection.Desc,
        })
      }
    },
    [sortState.sortBy, sortState.sortDirection]
  )

  const showLoadingSkeleton = loading || !!error
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolTransaction>()
    return [
      columnHelper.accessor((row) => row, {
        id: 'timestamp',
        header: () => (
          <Cell minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.Timestamp]} justifyContent="flex-start">
            <ClickableHeaderRow $justify="flex-start" onClick={() => handleHeaderClick(Transaction_OrderBy.Timestamp)}>
              {sortState.sortBy === Transaction_OrderBy.Timestamp && (
                <HeaderArrow direction={sortState.sortDirection} />
              )}
              <HeaderSortText $active={sortState.sortBy === Transaction_OrderBy.Timestamp}>
                <Trans>Time</Trans>
              </HeaderSortText>
            </ClickableHeaderRow>
          </Cell>
        ),
        cell: (row) => (
          <Cell
            loading={showLoadingSkeleton}
            minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.Timestamp]}
            justifyContent="flex-start"
          >
            <TimestampCell
              timestamp={Number(row.getValue?.().timestamp)}
              link={getExplorerLink(chainId, row.getValue?.().transaction, ExplorerDataType.TRANSACTION)}
            />
          </Cell>
        ),
      }),
      columnHelper.accessor(
        (row) => {
          let color, text
          if (row.type === PoolTransactionType.BUY) {
            color = 'success'
            text = (
              <span>
                <Trans>Buy</Trans>&nbsp;{token0?.symbol}
              </span>
            )
          } else if (row.type === PoolTransactionType.SELL) {
            color = 'critical'
            text = (
              <span>
                <Trans>Sell</Trans>&nbsp;{token0?.symbol}
              </span>
            )
          } else {
            color = row.type === PoolTransactionType.MINT ? 'success' : 'critical'
            text = row.type === PoolTransactionType.MINT ? <Trans>Add</Trans> : <Trans>Remove</Trans>
          }
          return <ThemedText.BodyPrimary color={color}>{text}</ThemedText.BodyPrimary>
        },
        {
          id: 'swap-type',
          header: () => (
            <Cell minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.Type]} justifyContent="flex-start">
              <FilterHeaderRow modalOpen={filterModalIsOpen} onClick={() => toggleFilterModal()}>
                <Filter
                  allFilters={Object.values(PoolTransactionType)}
                  activeFilter={filter}
                  setFilters={setFilters}
                  isOpen={filterModalIsOpen}
                  toggleFilterModal={toggleFilterModal}
                />
                <ThemedText.BodySecondary>
                  <Trans>Type</Trans>
                </ThemedText.BodySecondary>
              </FilterHeaderRow>
            </Cell>
          ),
          cell: (poolTransactionType) => (
            <Cell
              loading={showLoadingSkeleton}
              minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.Type]}
              justifyContent="flex-start"
            >
              {poolTransactionType.getValue?.()}
            </Cell>
          ),
        }
      ),
      columnHelper.accessor((row) => row.amountUSD, {
        id: 'fiat-value',
        header: () => (
          <Cell minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.FiatValue]} justifyContent="flex-end" grow>
            <ThemedText.BodySecondary>
              <Trans>{activeLocalCurrency}</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (fiat) => (
          <Cell
            loading={showLoadingSkeleton}
            minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.FiatValue]}
            justifyContent="flex-end"
            grow
          >
            <ThemedText.BodyPrimary>{formatFiatPrice({ price: fiat.getValue?.() })}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor(
        (row) => (row.pool.token0.id.toLowerCase() === token0?.id.toLowerCase() ? row.amount0 : row.amount1),
        {
          id: 'input-amount',
          header: () => (
            <Cell
              loading={showLoadingSkeleton}
              minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.InputAmount]}
              justifyContent="flex-end"
              grow
            >
              <StyledInternalLink to={`/explore/tokens/${chainName.toLowerCase()}/${token0?.id}`}>
                <ThemedText.BodySecondary>{token0?.symbol}</ThemedText.BodySecondary>
              </StyledInternalLink>
            </Cell>
          ),
          cell: (inputTokenAmount) => (
            <Cell
              loading={showLoadingSkeleton}
              minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.InputAmount]}
              justifyContent="flex-end"
              grow
            >
              <ThemedText.BodyPrimary>
                {formatNumber({ input: Math.abs(inputTokenAmount.getValue?.() ?? 0), type: NumberType.TokenTx })}
              </ThemedText.BodyPrimary>
            </Cell>
          ),
        }
      ),
      columnHelper.accessor(
        (row) => (row.pool.token0.id.toLowerCase() === token0?.id.toLowerCase() ? row.amount1 : row.amount0),
        {
          id: 'output-amount',
          header: () => (
            <Cell
              loading={showLoadingSkeleton}
              minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.OutputAmount]}
              justifyContent="flex-end"
              grow
            >
              <StyledInternalLink to={`/explore/tokens/${chainName.toLowerCase()}/${token1?.id}`}>
                <ThemedText.BodySecondary>{token1?.symbol}</ThemedText.BodySecondary>
              </StyledInternalLink>
            </Cell>
          ),
          cell: (outputTokenAmount) => (
            <Cell
              loading={showLoadingSkeleton}
              minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.OutputAmount]}
              justifyContent="flex-end"
              grow
            >
              <ThemedText.BodyPrimary>
                {formatNumber({ input: Math.abs(outputTokenAmount.getValue?.() ?? 0), type: NumberType.TokenTx })}
              </ThemedText.BodyPrimary>
            </Cell>
          ),
        }
      ),
      columnHelper.accessor((row) => row.maker, {
        id: 'maker-address',
        header: () => (
          <Cell
            minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.MakerAddress]}
            justifyContent="flex-end"
            grow
          >
            <ThemedText.BodySecondary>
              <Trans>Wallet</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (makerAddress) => (
          <Cell
            loading={showLoadingSkeleton}
            minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.MakerAddress]}
            justifyContent="flex-end"
            grow
          >
            <StyledExternalLink href={getExplorerLink(chainId, makerAddress.getValue?.(), ExplorerDataType.ADDRESS)}>
              <ThemedText.BodyPrimary>{shortenAddress(makerAddress.getValue?.(), 0)}</ThemedText.BodyPrimary>
            </StyledExternalLink>
          </Cell>
        ),
      }),
    ]
  }, [
    activeLocalCurrency,
    chainId,
    chainName,
    filter,
    filterModalIsOpen,
    formatFiatPrice,
    formatNumber,
    handleHeaderClick,
    showLoadingSkeleton,
    sortState.sortBy,
    sortState.sortDirection,
    token0?.id,
    token0?.symbol,
    token1?.id,
    token1?.symbol,
  ])

  return (
    <div data-testid="pool-details-transactions-table">
      <Table
        columns={columns}
        data={transactions}
        loading={loading}
        error={error}
        loadMore={loadMore}
        maxHeight={600}
      />
    </div>
  )
}
