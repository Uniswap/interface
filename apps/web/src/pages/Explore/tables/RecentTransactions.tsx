import { Trans } from '@lingui/macro'
import { createColumnHelper } from '@tanstack/react-table'
import { ChainId } from '@uniswap/sdk-core'
import Row from 'components/Row'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { Filter } from 'components/Table/Filter'
import {
  ClickableHeaderRow,
  FilterHeaderRow,
  HeaderArrow,
  StyledExternalLink,
  TimestampCell,
  TokenLinkCell,
} from 'components/Table/styled'
import { supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { Transaction, TransactionType, useRecentTransactions } from 'graphql/thegraph/Transactions'
import { OrderDirection, Transaction_OrderBy } from 'graphql/thegraph/__generated__/types-and-hooks'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useCallback, useMemo, useReducer, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ThemedText } from 'theme/components'
import { shortenAddress } from 'utils/addresses'
import { useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

type ExploreTxTableSortState = {
  sortBy: Transaction_OrderBy
  sortDirection: OrderDirection
}

export default function RecentTransactions() {
  const activeLocalCurrency = useActiveLocalCurrency()
  const { formatNumber, formatFiatPrice } = useFormatter()
  const [filterModalIsOpen, toggleFilterModal] = useReducer((s) => !s, false)
  const [filter, setFilters] = useState<TransactionType[]>([
    TransactionType.SWAP,
    TransactionType.BURN,
    TransactionType.MINT,
  ])
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)

  const [sortState, setSortMethod] = useState<ExploreTxTableSortState>({
    sortBy: Transaction_OrderBy.Timestamp,
    sortDirection: OrderDirection.Desc,
  })
  const { transactions, loading, loadMore, error } = useRecentTransactions(
    chainId ?? ChainId.MAINNET,
    sortState.sortBy,
    sortState.sortDirection,
    filter
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
  // TODO(WEB-3236): once GQL BE Transaction query is supported add usd, token0 amount, and token1 amount sort support
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Transaction>()
    return [
      columnHelper.accessor((transaction) => transaction, {
        id: 'timestamp',
        header: () => (
          <Cell minWidth={164} justifyContent="flex-start" grow>
            <ClickableHeaderRow $justify="flex-start" onClick={() => handleHeaderClick(Transaction_OrderBy.Timestamp)}>
              {sortState.sortBy === Transaction_OrderBy.Timestamp && (
                <HeaderArrow direction={sortState.sortDirection} />
              )}
              <ThemedText.BodySecondary>
                <Trans>Time</Trans>
              </ThemedText.BodySecondary>
            </ClickableHeaderRow>
          </Cell>
        ),
        cell: (transaction) => (
          <Cell loading={loading} minWidth={164} justifyContent="flex-start" grow>
            <TimestampCell
              timestamp={Number(transaction.getValue?.().timestamp)}
              link={getExplorerLink(chainId, transaction.getValue?.().hash, ExplorerDataType.TRANSACTION)}
            />
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction, {
        id: 'swap-type',
        header: () => (
          <Cell minWidth={300} justifyContent="flex-start" grow>
            <FilterHeaderRow modalOpen={filterModalIsOpen} onClick={() => toggleFilterModal()}>
              <Filter
                allFilters={Object.values(TransactionType)}
                activeFilter={filter}
                setFilters={setFilters}
                isOpen={filterModalIsOpen}
                toggleFilterModal={toggleFilterModal}
                isSticky={true}
              />
              <ThemedText.BodySecondary>
                <Trans>Type</Trans>
              </ThemedText.BodySecondary>
            </FilterHeaderRow>
          </Cell>
        ),
        cell: (transaction) => (
          <Cell loading={loading} minWidth={300} justifyContent="flex-start" grow>
            <Row gap="8px">
              <ThemedText.BodySecondary>{transaction.getValue?.().type}</ThemedText.BodySecondary>
              <TokenLinkCell chainId={chainId} tokenAddress={transaction.getValue?.().token0Address} />
              <ThemedText.BodySecondary>
                {transaction.getValue?.().type === TransactionType.SWAP ? <Trans>for</Trans> : <Trans>and</Trans>}
              </ThemedText.BodySecondary>
              <TokenLinkCell chainId={chainId} tokenAddress={transaction.getValue?.().token1Address} />
            </Row>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction.amountUSD, {
        id: 'fiat-value',
        header: () => (
          <Cell minWidth={125}>
            <ThemedText.BodySecondary>{activeLocalCurrency}</ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (fiat) => (
          <Cell loading={loading} minWidth={125}>
            <ThemedText.BodyPrimary>{formatFiatPrice({ price: fiat.getValue?.() })}</ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction, {
        id: 'token-amount-0',
        header: () => (
          <Cell minWidth={200}>
            <ThemedText.BodySecondary>
              <Trans>Token amount</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (transaction) => (
          <Cell loading={loading} minWidth={200}>
            <Row gap="8px" justify="flex-end">
              <ThemedText.BodyPrimary>
                {formatNumber({
                  input: Math.abs(transaction.getValue?.().amountToken0) || 0,
                })}
              </ThemedText.BodyPrimary>
              <TokenLinkCell chainId={chainId} tokenAddress={transaction.getValue?.().token0Address} />
            </Row>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction, {
        id: 'token-amount-1',
        header: () => (
          <Cell minWidth={200}>
            <ThemedText.BodySecondary>
              <Trans>Token amount</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (transaction) => (
          <Cell loading={loading} minWidth={200}>
            <Row gap="8px" justify="flex-end">
              <ThemedText.BodyPrimary>
                {formatNumber({
                  input: Math.abs(transaction.getValue?.().amountToken1) || 0,
                })}
              </ThemedText.BodyPrimary>
              <TokenLinkCell chainId={chainId} tokenAddress={transaction.getValue?.().token1Address} />
            </Row>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction.sender, {
        id: 'maker-address',
        header: () => (
          <Cell minWidth={125}>
            <ThemedText.BodySecondary>
              <Trans>Wallet</Trans>
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (makerAddress) => (
          <Cell loading={loading} minWidth={125}>
            <StyledExternalLink href={getExplorerLink(chainId, makerAddress.getValue?.(), ExplorerDataType.ADDRESS)}>
              {shortenAddress(makerAddress.getValue?.(), 0)}
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
    handleHeaderClick,
    loading,
    sortState.sortBy,
    sortState.sortDirection,
  ])

  if (error) {
    return (
      <ThemedText.BodyPrimary>
        <Trans>Error loading transactions</Trans>
      </ThemedText.BodyPrimary>
    )
  }

  return <Table columns={columns} data={transactions} loading={loading} loadMore={loadMore} />
}
