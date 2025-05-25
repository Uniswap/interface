import { ApolloError } from '@apollo/client'
import { createColumnHelper } from '@tanstack/react-table'
import { BETypeToTransactionType, TransactionType, useAllTransactions } from 'appGraphql/data/useAllTransactions'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { Filter } from 'components/Table/Filter'
import {
  FilterHeaderRow,
  HeaderCell,
  StyledExternalLink,
  TableText,
  TimestampCell,
  TokenLinkCell,
} from 'components/Table/styled'
import { useUpdateManualOutage } from 'featureFlags/flags/outageBanner'
import { useFilteredTransactions } from 'pages/Explore/tables/useFilterTransaction'
import { memo, useMemo, useReducer, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text, styled, useMedia } from 'ui/src'
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
import { NumberType, useFormatter } from 'utils/formatNumbers'

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
  const { t } = useTranslation()

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
  const media = useMedia()
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolTransaction>()
    const filteredColumns = [
      !media.lg
        ? columnHelper.accessor((transaction) => transaction, {
            id: 'timestamp',
            size: media.lg ? 60 : 80,
            header: () => (
              <HeaderCell justifyContent="flex-start">
                <TableRow>
                  <Text variant="body3" color="$neutral2">
                    <Trans i18nKey="common.time" />
                  </Text>
                </TableRow>
              </HeaderCell>
            ),
            cell: (transaction) => (
              <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
                <TimestampCell
                  timestamp={Number(transaction.getValue?.().timestamp)}
                  link={getExplorerLink(chainInfo.id, transaction.getValue?.().hash, ExplorerDataType.TRANSACTION)}
                />
              </Cell>
            ),
          })
        : null,
      columnHelper.accessor((transaction) => transaction, {
        id: 'swap-type',
        size: media.lg ? 180 : 320,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <FilterHeaderRow clickable={filterModalIsOpen} onPress={() => toggleFilterModal()} ref={filterAnchorRef}>
              <Filter
                allFilters={Object.values(TransactionType)}
                activeFilter={filter}
                setFilters={setFilters}
                isOpen={filterModalIsOpen}
                toggleFilterModal={toggleFilterModal}
                anchorRef={filterAnchorRef}
              />
              <Text variant="body3" color="$neutral2">
                <Trans i18nKey="common.type.label" />
              </Text>
            </FilterHeaderRow>
          </HeaderCell>
        ),
        cell: (transaction) => (
          <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
            <Text variant="body2" display="flex" flexDirection="row" gap="$spacing8" alignItems="center">
              {media.lg && (
                <PortfolioLogo
                  chainId={chainInfo.id}
                  images={[
                    transaction.getValue?.().token0.project?.logo?.url,
                    transaction.getValue?.().token1.project?.logo?.url,
                  ]}
                  size={20}
                />
              )}
              <TableText color="$neutral2" $lg={{ display: 'none' }}>
                {BETypeToTransactionType[transaction.getValue?.().type]}
              </TableText>
              <TokenLinkCell token={transaction.getValue?.().token0} hideLogo={media.lg} />
              <Text color="$neutral2">
                {transaction.getValue?.().type === PoolTransactionType.Swap
                  ? t('common.for').toLowerCase()
                  : t('common.and').toLowerCase()}
              </Text>
              <TokenLinkCell token={transaction.getValue?.().token1} hideLogo={media.lg} />
            </Text>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction.usdValue.value, {
        id: 'fiat-value',
        maxSize: 125,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {activeLocalCurrency}
            </Text>
          </HeaderCell>
        ),
        cell: (fiat) => (
          <Cell loading={showLoadingSkeleton}>
            <TableText>{formatFiatPrice({ price: fiat.getValue?.() })}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction, {
        id: 'token-amount-0',
        size: 200,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="common.tokenAmount" />
            </Text>
          </HeaderCell>
        ),
        cell: (transaction) => (
          <Cell loading={showLoadingSkeleton}>
            <TableRow justifyContent="flex-end">
              <TableText variant="body2" color="$neutral1">
                {formatNumber({
                  input: Math.abs(parseFloat(transaction.getValue?.().token0Quantity)) || 0,
                  type: NumberType.TokenQuantityStats,
                })}
              </TableText>
              <TokenLinkCell token={transaction.getValue?.().token0} />
            </TableRow>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction, {
        id: 'token-amount-1',
        size: 200,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="common.tokenAmount" />
            </Text>
          </HeaderCell>
        ),
        cell: (transaction) => (
          <Cell loading={showLoadingSkeleton}>
            <TableRow justifyContent="flex-end">
              <TableText variant="body2" color="$neutral1">
                {formatNumber({
                  input: Math.abs(parseFloat(transaction.getValue?.().token1Quantity)) || 0,
                  type: NumberType.TokenQuantityStats,
                })}
              </TableText>
              <TokenLinkCell token={transaction.getValue?.().token1} />
            </TableRow>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction.account, {
        id: 'maker-address',
        maxSize: 150,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="common.wallet.label" />
            </Text>
          </HeaderCell>
        ),
        cell: (makerAddress) => (
          <Cell loading={showLoadingSkeleton}>
            <StyledExternalLink
              href={getExplorerLink(chainInfo.id, makerAddress.getValue?.(), ExplorerDataType.ADDRESS)}
            >
              <TableText>{shortenAddress(makerAddress.getValue?.())}</TableText>
            </StyledExternalLink>
          </Cell>
        ),
      }),
    ]
    return filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> => Boolean(column))
  }, [
    activeLocalCurrency,
    chainInfo.id,
    media.lg,
    filter,
    filterModalIsOpen,
    formatFiatPrice,
    formatNumber,
    showLoadingSkeleton,
    t,
  ])

  return (
    <Table
      columns={columns}
      data={filteredTransactions}
      loading={allDataStillLoading}
      error={combinedError}
      loadMore={loadMore}
      maxWidth={1200}
      defaultPinnedColumns={['timestamp', 'swap-type']}
    />
  )
})

export default RecentTransactions
