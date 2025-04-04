import { ApolloError } from '@apollo/client'
import { createColumnHelper } from '@tanstack/react-table'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { Filter } from 'components/Table/Filter'
import {
  FilterHeaderRow,
  HeaderArrow,
  HeaderSortText,
  StyledExternalLink,
  TimestampCell,
  TokenLinkCell,
} from 'components/Table/styled'
import { useUpdateManualOutage } from 'featureFlags/flags/outageBanner'
import { BETypeToTransactionType, TransactionType, useAllTransactions } from 'graphql/data/useAllTransactions'
import { OrderDirection } from 'graphql/data/util'
import { useFilteredTransactions } from 'pages/Explore/tables/useFilterTransaction'
import { memo, useMemo, useReducer, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import { Flex, Text, styled } from 'ui/src'
import {
  PoolTransaction,
  PoolTransactionType,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { useChainIdFromUrlParam } from 'utils/chainParams'
import { useFormatter } from 'utils/formatNumbers'

const TableRow = styled(Flex, {
  row: true,
  gap: '$gap4',
  alignItems: 'center',
})

const RecentTransactions = memo(function RecentTransactions() {
  const activeLocalCurrency = useAppFiatCurrency()
  const { formatNumber, formatFiatPrice } = useFormatter()
  const [filterModalIsOpen, toggleFilterModal] = useReducer((s) => !s, false)
  const filterAnchorRef = useRef<HTMLDivElement>(null)
  const [filter, setFilters] = useState<TransactionType[]>([
    TransactionType.SWAP,
    TransactionType.REMOVE,
    TransactionType.ADD,
  ])
  const chainInfo = getChainInfo(useChainIdFromUrlParam() ?? UniverseChainId.Mainnet)

  const { transactions, loading, loadMore, errorV2, errorV3 } = useAllTransactions(chainInfo.backendChain.chain, filter)
  const filteredTransactions = useFilteredTransactions(transactions)

  const combinedError =
    errorV2 && errorV3
      ? new ApolloError({ errorMessage: `Could not retrieve V2 and V3 Transactions for chain: ${chainInfo.id}` })
      : undefined
  const allDataStillLoading = loading && !transactions.length
  const showLoadingSkeleton = allDataStillLoading || !!combinedError
  useUpdateManualOutage({ chainId: chainInfo.id, errorV3, errorV2 })
  // TODO(WEB-3236): once GQL BE Transaction query is supported add usd, token0 amount, and token1 amount sort support
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolTransaction>()
    return [
      columnHelper.accessor((transaction) => transaction, {
        id: 'timestamp',
        header: () => (
          <Cell minWidth={120} justifyContent="flex-start" grow>
            <TableRow>
              <HeaderArrow direction={OrderDirection.Desc} />
              <HeaderSortText active>
                <Trans i18nKey="common.time" />
              </HeaderSortText>
            </TableRow>
          </Cell>
        ),
        cell: (transaction) => (
          <Cell loading={showLoadingSkeleton} minWidth={120} justifyContent="flex-start" grow>
            <TimestampCell
              timestamp={Number(transaction.getValue?.().timestamp)}
              link={getExplorerLink(chainInfo.id, transaction.getValue?.().hash, ExplorerDataType.TRANSACTION)}
            />
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction, {
        id: 'swap-type',
        header: () => (
          <Cell minWidth={276} justifyContent="flex-start" grow>
            <FilterHeaderRow clickable={filterModalIsOpen} onPress={() => toggleFilterModal()} ref={filterAnchorRef}>
              <Filter
                allFilters={Object.values(TransactionType)}
                activeFilter={filter}
                setFilters={setFilters}
                isOpen={filterModalIsOpen}
                toggleFilterModal={toggleFilterModal}
                anchorRef={filterAnchorRef}
              />
              <Text variant="body2" color="$neutral2">
                <Trans i18nKey="common.type.label" />
              </Text>
            </FilterHeaderRow>
          </Cell>
        ),
        cell: (transaction) => {
          const amountWithSymbolA = (
            <>
              <Text variant="body2" color="$neutral2">
                {BETypeToTransactionType[transaction.getValue?.().type]}
              </Text>
              <TokenLinkCell token={transaction.getValue?.().token0} />
            </>
          )
          const amountWithSymbolB = <TokenLinkCell token={transaction.getValue?.().token1} />

          return (
            <Cell loading={showLoadingSkeleton} minWidth={276} justifyContent="flex-start" grow>
              <Text variant="body2" display="flex" flexDirection="row" gap="$spacing8">
                {transaction.getValue?.().type === PoolTransactionType.Swap ? (
                  <Trans
                    i18nKey="activity.transaction.swap.descriptor.formatted"
                    components={{
                      amountWithSymbolA,
                      amountWithSymbolB,
                    }}
                  />
                ) : (
                  <Trans
                    i18nKey="activity.transaction.tokens.descriptor.formatted"
                    components={{
                      amountWithSymbolA,
                      amountWithSymbolB,
                    }}
                  />
                )}
              </Text>
            </Cell>
          )
        },
      }),
      columnHelper.accessor((transaction) => transaction.usdValue.value, {
        id: 'fiat-value',
        header: () => (
          <Cell minWidth={125}>
            <Text variant="body2" color="$neutral2">
              {activeLocalCurrency}
            </Text>
          </Cell>
        ),
        cell: (fiat) => (
          <Cell loading={showLoadingSkeleton} minWidth={125}>
            <Text variant="body2" color="$neutral1">
              {formatFiatPrice({ price: fiat.getValue?.() })}
            </Text>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction, {
        id: 'token-amount-0',
        header: () => (
          <Cell minWidth={200}>
            <Text variant="body2" color="$neutral2">
              <Trans i18nKey="common.tokenAmount" />
            </Text>
          </Cell>
        ),
        cell: (transaction) => (
          <Cell loading={showLoadingSkeleton} minWidth={200}>
            <TableRow justifyContent="flex-end">
              <Text variant="body2" color="$neutral1">
                {formatNumber({
                  input: Math.abs(parseFloat(transaction.getValue?.().token0Quantity)) || 0,
                })}
              </Text>
              <TokenLinkCell token={transaction.getValue?.().token0} />
            </TableRow>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction, {
        id: 'token-amount-1',
        header: () => (
          <Cell minWidth={200}>
            <Text variant="body2" color="$neutral2">
              <Trans i18nKey="common.tokenAmount" />
            </Text>
          </Cell>
        ),
        cell: (transaction) => (
          <Cell loading={showLoadingSkeleton} minWidth={200}>
            <TableRow justifyContent="flex-end">
              <Text variant="body2" color="$neutral1">
                {formatNumber({
                  input: Math.abs(parseFloat(transaction.getValue?.().token1Quantity)) || 0,
                })}
              </Text>
              <TokenLinkCell token={transaction.getValue?.().token1} />
            </TableRow>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction.account, {
        id: 'maker-address',
        header: () => (
          <Cell minWidth={150}>
            <Text variant="body2" color="$neutral2">
              <Trans i18nKey="common.wallet.label" />
            </Text>
          </Cell>
        ),
        cell: (makerAddress) => (
          <Cell loading={showLoadingSkeleton} minWidth={150}>
            <StyledExternalLink
              href={getExplorerLink(chainInfo.id, makerAddress.getValue?.(), ExplorerDataType.ADDRESS)}
            >
              {shortenAddress(makerAddress.getValue?.())}
            </StyledExternalLink>
          </Cell>
        ),
      }),
    ]
  }, [activeLocalCurrency, chainInfo.id, filter, filterModalIsOpen, formatFiatPrice, formatNumber, showLoadingSkeleton])

  return (
    <Table
      columns={columns}
      data={filteredTransactions}
      loading={allDataStillLoading}
      error={combinedError}
      loadMore={loadMore}
      maxWidth={1200}
    />
  )
})

export default RecentTransactions
