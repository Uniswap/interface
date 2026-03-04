/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { ApolloError } from '@apollo/client'
import { createColumnHelper } from '@tanstack/react-table'
import { GraphQLApi } from '@universe/api'
import { memo, useMemo, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, useMedia } from 'ui/src'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import {
  BETypeToTransactionType,
  getTransactionTypeTranslation,
  TransactionType,
  useAllTransactions,
} from '~/appGraphql/data/useAllTransactions'
import { PortfolioLogo } from '~/components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { AddressHoverCard } from '~/components/AddressHoverCard/AddressHoverCard'
import { InternalLink } from '~/components/InternalLink'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { Filter } from '~/components/Table/Filter'
import { FilterHeaderRow, HeaderCell, TableText, TimestampCell, TokenLinkCell } from '~/components/Table/styled'
import { useUpdateManualOutage } from '~/hooks/useUpdateManualOutage'
import { useFilteredTransactions } from '~/pages/Explore/tables/RecentTransactions/useFilterTransaction'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'
import { useChainIdFromUrlParam } from '~/utils/chainParams'

const TableRow = styled(Flex, {
  row: true,
  gap: '$gap4',
  alignItems: 'center',
})

type RecentTransactionType = GraphQLApi.PoolTransaction & { usdValueFormatted: string }

export const RecentTransactionsTable = memo(function RecentTransactions() {
  const activeLocalCurrency = useAppFiatCurrency()
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
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
  const filteredTransactionsWithFiat = useMemo(() => {
    return filteredTransactions.map((transaction) => {
      return {
        ...transaction,
        // We have to format the fiat value in object, as cells are not reactive.
        usdValueFormatted: convertFiatAmountFormatted(transaction.usdValue.value, NumberType.FiatTokenPrice),
      }
    })
  }, [filteredTransactions, convertFiatAmountFormatted])

  const combinedError =
    errorV2 && errorV3
      ? new ApolloError({ errorMessage: `Could not retrieve V2 and V3 Transactions for chain: ${chainInfo.id}` })
      : undefined
  const allDataStillLoading = loading && !transactions.length
  const showLoadingSkeleton = allDataStillLoading || !!combinedError
  useUpdateManualOutage({ chainId: chainInfo.id, errorV3, errorV2, trigger: transactions })
  // TODO(WEB-3236): once GQL BE Transaction query is supported add usd, token0 amount, and token1 amount sort support
  const media = useMedia()
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<RecentTransactionType>()
    const filteredColumns = [
      !media.lg
        ? columnHelper.accessor((transaction) => transaction, {
            id: 'timestamp',
            size: 80,
            header: () => (
              <HeaderCell justifyContent="flex-start">
                <TableRow>
                  <Text variant="body3" color="$neutral2">
                    {t('common.time')}
                  </Text>
                </TableRow>
              </HeaderCell>
            ),
            cell: (transaction) => (
              <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
                <TimestampCell
                  timestamp={Number(transaction.getValue?.().timestamp)}
                  link={getExplorerLink({
                    chainId: chainInfo.id,
                    data: transaction.getValue?.().hash,
                    type: ExplorerDataType.TRANSACTION,
                  })}
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
            <FilterHeaderRow
              clickable={filterModalIsOpen}
              onPress={() => !filterModalIsOpen && toggleFilterModal()}
              ref={filterAnchorRef}
            >
              <Filter
                allFilters={Object.values(TransactionType).map((type) => ({
                  value: type,
                  label: getTransactionTypeTranslation(type),
                }))}
                activeFilter={filter}
                setFilters={setFilters}
                isOpen={filterModalIsOpen}
                toggleFilterModal={toggleFilterModal}
                anchorRef={filterAnchorRef}
                minSelected={1}
              />
              <Text variant="body3" color="$neutral2">
                {t('common.type.label')}
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
                  fallbackSymbols={[transaction.getValue?.().token0.symbol, transaction.getValue?.().token1.symbol]}
                  size={22}
                />
              )}
              <TableText color="$neutral2" $lg={{ display: 'none' }}>
                {BETypeToTransactionType[transaction.getValue?.().type]}
              </TableText>
              <TokenLinkCell token={transaction.getValue?.().token0} hideLogo={media.lg} />
              <Text color="$neutral2">
                {transaction.getValue?.().type === GraphQLApi.PoolTransactionType.Swap
                  ? t('common.for').toLowerCase()
                  : t('common.and').toLowerCase()}
              </Text>
              <TokenLinkCell token={transaction.getValue?.().token1} hideLogo={media.lg} />
            </Text>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction.usdValueFormatted, {
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
            <TableText>{fiat.getValue?.()}</TableText>
          </Cell>
        ),
      }),
      columnHelper.accessor((transaction) => transaction, {
        id: 'token-amount-0',
        size: 200,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('common.tokenAmount')}
            </Text>
          </HeaderCell>
        ),
        cell: (transaction) => (
          <Cell loading={showLoadingSkeleton}>
            <TableRow justifyContent="flex-end">
              <TableText variant="body2" color="$neutral1">
                {formatNumberOrString({
                  value: Math.abs(parseFloat(transaction.getValue?.().token0Quantity)) || 0,
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
              {t('common.tokenAmount')}
            </Text>
          </HeaderCell>
        ),
        cell: (transaction) => (
          <Cell loading={showLoadingSkeleton}>
            <TableRow justifyContent="flex-end">
              <TableText variant="body2" color="$neutral1">
                {formatNumberOrString({
                  value: Math.abs(parseFloat(transaction.getValue?.().token1Quantity)) || 0,
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
              {t('common.wallet.label')}
            </Text>
          </HeaderCell>
        ),
        cell: (makerAddress) => {
          const address = makerAddress.getValue?.()
          const shortenedAddress = shortenAddress({ address })

          return (
            <Cell loading={showLoadingSkeleton}>
              <AddressHoverCard address={address} platform={chainInfo.platform}>
                <InternalLink to={buildPortfolioUrl({ externalAddress: address })}>
                  <TableText>{shortenedAddress}</TableText>
                </InternalLink>
              </AddressHoverCard>
            </Cell>
          )
        },
      }),
    ]
    return filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> => Boolean(column))
  }, [
    activeLocalCurrency,
    chainInfo.id,
    chainInfo.platform,
    media.lg,
    filter,
    filterModalIsOpen,
    formatNumberOrString,
    showLoadingSkeleton,
    t,
  ])

  return (
    <Table
      columns={columns}
      data={filteredTransactionsWithFiat}
      loading={allDataStillLoading}
      error={combinedError}
      v2={false}
      loadMore={loadMore}
      maxWidth={1200}
      defaultPinnedColumns={['timestamp', 'swap-type']}
    />
  )
})
