import { Trans } from '@lingui/macro'
import { createColumnHelper } from '@tanstack/react-table'
import Row from 'components/Row'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { Filter } from 'components/Table/Filter'
import { FilterHeaderRow, HeaderArrow, HeaderSortText, TimestampCell } from 'components/Table/styled'
import { ProtocolVersion, Token } from 'graphql/data/__generated__/types-and-hooks'
import {
  PoolTableTransaction,
  PoolTableTransactionType,
  usePoolTransactions,
} from 'graphql/data/pools/usePoolTransactions'
import { supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { OrderDirection, Transaction_OrderBy } from 'graphql/thegraph/__generated__/types-and-hooks'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useMemo, useReducer, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const StyledExternalLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.neutral2};
  stroke: ${({ theme }) => theme.neutral2};
`

const TableWrapper = styled.div`
  min-height: 256px;
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
  [PoolTransactionColumn.Timestamp]: 120,
  [PoolTransactionColumn.Type]: 144,
  [PoolTransactionColumn.MakerAddress]: 100,
  [PoolTransactionColumn.FiatValue]: 125,
  [PoolTransactionColumn.InputAmount]: 125,
  [PoolTransactionColumn.OutputAmount]: 125,
}

export function PoolDetailsTransactionsTable({
  poolAddress,
  token0,
  token1,
  protocolVersion,
}: {
  poolAddress: string
  token0?: Token
  token1?: Token
  protocolVersion?: ProtocolVersion
}) {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  const activeLocalCurrency = useActiveLocalCurrency()
  const { formatNumber, formatFiatPrice } = useFormatter()
  const [filterModalIsOpen, toggleFilterModal] = useReducer((s) => !s, false)
  const [filter, setFilters] = useState<PoolTableTransactionType[]>([
    PoolTableTransactionType.BUY,
    PoolTableTransactionType.SELL,
    PoolTableTransactionType.BURN,
    PoolTableTransactionType.MINT,
  ])

  const [sortState] = useState<PoolTxTableSortState>({
    sortBy: Transaction_OrderBy.Timestamp,
    sortDirection: OrderDirection.Desc,
  })
  const { transactions, loading, loadMore, error } = usePoolTransactions(
    poolAddress,
    chainId,
    filter,
    token0,
    protocolVersion
  )

  const showLoadingSkeleton = loading || !!error
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolTableTransaction>()
    return [
      columnHelper.accessor((row) => row, {
        id: 'timestamp',
        header: () => (
          <Cell minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.Timestamp]} justifyContent="flex-start">
            <Row gap="4px">
              {sortState.sortBy === Transaction_OrderBy.Timestamp && <HeaderArrow direction={OrderDirection.Desc} />}
              <HeaderSortText $active={sortState.sortBy === Transaction_OrderBy.Timestamp}>
                <Trans>Time</Trans>
              </HeaderSortText>
            </Row>
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
          if (row.type === PoolTableTransactionType.BUY) {
            color = 'success'
            text = (
              <span>
                <Trans>Buy</Trans>&nbsp;{token0?.symbol}
              </span>
            )
          } else if (row.type === PoolTableTransactionType.SELL) {
            color = 'critical'
            text = (
              <span>
                <Trans>Sell</Trans>&nbsp;{token0?.symbol}
              </span>
            )
          } else {
            color = row.type === PoolTableTransactionType.MINT ? 'success' : 'critical'
            text = row.type === PoolTableTransactionType.MINT ? <Trans>Add</Trans> : <Trans>Remove</Trans>
          }
          return <ThemedText.BodyPrimary color={color}>{text}</ThemedText.BodyPrimary>
        },
        {
          id: 'swap-type',
          header: () => (
            <Cell minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.Type]} justifyContent="flex-start">
              <FilterHeaderRow modalOpen={filterModalIsOpen} onClick={() => toggleFilterModal()}>
                <Filter
                  allFilters={Object.values(PoolTableTransactionType)}
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
          cell: (PoolTransactionTableType) => (
            <Cell
              loading={showLoadingSkeleton}
              minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.Type]}
              justifyContent="flex-start"
            >
              {PoolTransactionTableType.getValue?.()}
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
        (row) => (row.pool.token0.id.toLowerCase() === token0?.address?.toLowerCase() ? row.amount0 : row.amount1),
        {
          id: 'input-amount',
          header: () => (
            <Cell
              loading={showLoadingSkeleton}
              minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.InputAmount]}
              justifyContent="flex-end"
              grow
            >
              <ThemedText.BodySecondary>{token0?.symbol}</ThemedText.BodySecondary>
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
        (row) => (row.pool.token0.id.toLowerCase() === token0?.address?.toLowerCase() ? row.amount1 : row.amount0),
        {
          id: 'output-amount',
          header: () => (
            <Cell
              loading={showLoadingSkeleton}
              minWidth={PoolTransactionColumnWidth[PoolTransactionColumn.OutputAmount]}
              justifyContent="flex-end"
              grow
            >
              <ThemedText.BodySecondary>{token1?.symbol}</ThemedText.BodySecondary>
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
    filter,
    filterModalIsOpen,
    formatFiatPrice,
    formatNumber,
    showLoadingSkeleton,
    sortState.sortBy,
    token0?.address,
    token0?.symbol,
    token1?.symbol,
  ])

  return (
    <TableWrapper data-testid="pool-details-transactions-table">
      <Table
        columns={columns}
        data={transactions}
        loading={loading}
        error={error}
        loadMore={loadMore}
        maxHeight={600}
      />
    </TableWrapper>
  )
}
