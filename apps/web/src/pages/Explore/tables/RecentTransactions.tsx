import { Trans } from '@lingui/macro'
import { createColumnHelper } from '@tanstack/react-table'
import { ChainId } from '@uniswap/sdk-core'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { Filter } from 'components/Table/Filter'
import {
  ClickableHeaderRow,
  FilterHeaderRow,
  HeaderArrow,
  StyledExternalLink,
  StyledInternalLink,
} from 'components/Table/styled'
import { getLocaleTimeString } from 'components/Table/utils'
import { DEFAULT_LOCALE } from 'constants/locales'
import { supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { OrderDirection, Transaction_OrderBy } from 'graphql/thegraph/__generated__/types-and-hooks'
import { Transaction, TransactionType, useRecentTransactions } from 'graphql/thegraph/Transactions'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useCallback, useMemo, useReducer, useRef, useState } from 'react'
import { ExternalLink as ExternalLinkIcon } from 'react-feather'
import { useParams } from 'react-router-dom'
import { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { shortenAddress } from 'utils/addresses'
import { useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

type ExploreTxTableSortState = {
  sortBy: Transaction_OrderBy
  sortDirection: OrderDirection
}

export default function RecentTransactions() {
  const theme = useTheme()
  const locale = useActiveLocale()
  const activeLocalCurrency = useActiveLocalCurrency()
  const { formatNumber, formatFiatPrice } = useFormatter()
  const [filterModalIsOpen, toggleFilterModal] = useReducer((s) => !s, false)
  const filterModalRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(filterModalRef, filterModalIsOpen ? toggleFilterModal : undefined)
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
  const { transactions, loading, loadMore } = useRecentTransactions(
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
      columnHelper.accessor((transaction) => transaction.timestamp, {
        id: 'timestamp',
        header: () => (
          <Cell minWidth={185} justifyContent="flex-start" grow>
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
        cell: (timestamp) => (
          <Cell loading={loading} minWidth={185} justifyContent="flex-start" grow>
            <ThemedText.BodySecondary>
              {getLocaleTimeString(Number(timestamp.getValue?.()) * 1000, locale ?? DEFAULT_LOCALE)}
            </ThemedText.BodySecondary>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction, {
        id: 'swap-type',
        header: () => (
          <Cell minWidth={185} justifyContent="flex-start" grow>
            <FilterHeaderRow modalOpen={filterModalIsOpen} onClick={() => toggleFilterModal()} ref={filterModalRef}>
              <Filter
                allFilters={Object.values(TransactionType)}
                activeFilter={filter}
                setFilters={setFilters}
                isOpen={filterModalIsOpen}
                isSticky={true}
              />
              <ThemedText.BodySecondary>
                <Trans>Type</Trans>
              </ThemedText.BodySecondary>
            </FilterHeaderRow>
          </Cell>
        ),
        cell: (transaction) => (
          <Cell loading={loading} minWidth={185} justifyContent="flex-start" grow>
            <ThemedText.BodyPrimary>
              {transaction.getValue?.().type}{' '}
              <StyledInternalLink
                to={`/explore/tokens/${chainName.toLowerCase()}/${transaction.getValue?.().token0Address}`}
              >
                {transaction.getValue?.().token0Symbol}
              </StyledInternalLink>{' '}
              {transaction.getValue?.().type === TransactionType.SWAP ? <Trans>for</Trans> : <Trans>and</Trans>}{' '}
              <StyledInternalLink
                to={`/explore/tokens/${chainName.toLowerCase()}/${transaction.getValue?.().token1Address}`}
              >
                {transaction.getValue?.().token1Symbol}
              </StyledInternalLink>{' '}
            </ThemedText.BodyPrimary>
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
            <ThemedText.BodyPrimary>
              {formatNumber({
                input: Math.abs(transaction.getValue?.().amountToken0) || 0,
              })}{' '}
              <StyledInternalLink
                to={`/explore/tokens/${chainName.toLowerCase()}/${transaction.getValue?.().token0Address}`}
              >
                {transaction.getValue?.().token0Symbol}
              </StyledInternalLink>
            </ThemedText.BodyPrimary>
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
            <ThemedText.BodyPrimary>
              {formatNumber({
                input: Math.abs(transaction.getValue?.().amountToken1) || 0,
              })}{' '}
              <StyledInternalLink
                to={`/explore/tokens/${chainName.toLowerCase()}/${transaction.getValue?.().token1Address}`}
              >
                {transaction.getValue?.().token1Symbol}
              </StyledInternalLink>
            </ThemedText.BodyPrimary>
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
      columnHelper.accessor(
        (transaction) => getExplorerLink(chainId ?? ChainId.MAINNET, transaction.hash, ExplorerDataType.TRANSACTION),
        {
          id: 'explorer-link',
          header: () => (
            <Cell minWidth={60}>
              <ThemedText.BodySecondary>
                <Trans>Tx</Trans>
              </ThemedText.BodySecondary>
            </Cell>
          ),
          cell: (explorerLink) => (
            <Cell loading={loading} minWidth={60}>
              <StyledExternalLink href={explorerLink.getValue?.()}>
                <ExternalLinkIcon size="16px" stroke={theme.neutral2} />
              </StyledExternalLink>
            </Cell>
          ),
        }
      ),
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
    loading,
    locale,
    sortState.sortBy,
    sortState.sortDirection,
    theme.neutral2,
  ])

  return <Table columns={columns} data={transactions} loading={loading} loadMore={loadMore} />
}
