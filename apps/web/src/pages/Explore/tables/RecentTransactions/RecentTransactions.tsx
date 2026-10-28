/* oxlint-disable typescript/no-unnecessary-condition */

import { createColumnHelper } from '@tanstack/react-table'
import { TransactionEventType } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { Flex, Text, useMedia } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { memo, useMemo, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { PortfolioLogo } from '~/components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { WalletHoverCard } from '~/components/HoverCard/WalletHoverCard/WalletHoverCard'
import { InternalLink } from '~/components/InternalLink'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { Filter } from '~/components/Table/Filter'
import {
  COLLAPSIBLE_CELL_STYLES,
  CollapsibleCellLayout,
} from '~/components/Table/PinnedColumns/collapse/CollapsibleCellLayout'
import {
  EXPANDED_LOGO_SIZE,
  FLUSH_CELL_PADDING,
  FLUSH_COLLAPSED_COLUMN_WIDTH,
  FLUSH_HEADER_CELL_PADDING,
} from '~/components/Table/PinnedColumns/collapse/utils'
import { TableText } from '~/components/Table/shared/TableText'
import { TimestampCell } from '~/components/Table/shared/TimestampCell'
import { TokenLinkCell } from '~/components/Table/shared/TokenLinkCell'
import { FilterHeaderRow, HeaderCell } from '~/components/Table/styled'
import type { PoolTransaction } from '~/data/transactions/poolTransaction'
import {
  BETypeToTransactionType,
  TransactionType,
  useAllTransactions,
} from '~/features/Explore/state/transactions/useAllTransactions'
import { useFilteredTransactions } from '~/pages/Explore/tables/RecentTransactions/useFilterTransaction'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

const TableRow = styled(Flex, {
  base: 'flex-row items-center gap-[4px]',
})

type RecentTransactionType = PoolTransaction & { usdValueFormatted: string }

const MOBILE_SWAP_TYPE_COLUMN_SIZE_PX = 180

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
  const media = useMedia()
  const { transactions, loading, loadMore, error } = useAllTransactions(chainInfo.id, filter)

  const filteredTransactions = useFilteredTransactions(transactions)
  const filteredTransactionsWithFiat = useMemo(() => {
    return filteredTransactions.map((transaction) => {
      return {
        ...transaction,
        // We have to format the fiat value in object, as cells are not reactive.
        usdValueFormatted: convertFiatAmountFormatted(transaction.usdValue, NumberType.FiatTokenPrice),
      }
    })
  }, [filteredTransactions, convertFiatAmountFormatted])

  const getTransactionTypeTranslation = useEvent((type: TransactionType): string => {
    switch (type) {
      case TransactionType.SWAP:
        return t('common.swap')
      case TransactionType.ADD:
        return t('common.add.label')
      case TransactionType.REMOVE:
        return t('common.remove.label')
      default:
        return ''
    }
  })

  const hasError = Boolean(error)
  const allDataStillLoading = loading && !transactions.length
  const showLoadingSkeleton = allDataStillLoading || hasError

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
                    chainId: transaction.getValue?.().chainId ?? chainInfo.id,
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
        size: media.lg ? MOBILE_SWAP_TYPE_COLUMN_SIZE_PX : 320,
        meta: { collapsedWidth: FLUSH_COLLAPSED_COLUMN_WIDTH },
        header: () => (
          <HeaderCell justifyContent="flex-start" {...(media.lg ? FLUSH_HEADER_CELL_PADDING : undefined)}>
            <FilterHeaderRow onPress={() => !filterModalIsOpen && toggleFilterModal()} ref={filterAnchorRef}>
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
              {/* Fades with the collapse like the cell text; the filter icon stays as the collapsed header. */}
              <Text variant="body3" color="$neutral2" style={COLLAPSIBLE_CELL_STYLES.text}>
                {t('common.type.label')}
              </Text>
            </FilterHeaderRow>
          </HeaderCell>
        ),
        cell: (transaction) => {
          const row = transaction.getValue?.()
          const pair = (
            <Text variant="body2" display="flex" flexDirection="row" gap="$spacing8" alignItems="center">
              <TableText color="$neutral2" $lg={{ display: 'none' }}>
                {BETypeToTransactionType[row?.eventType]}
              </TableText>
              <TokenLinkCell token={row?.token0} hideLogo={media.lg} />
              <Text color="$neutral2">
                {row?.eventType === TransactionEventType.SWAP
                  ? t('common.for').toLowerCase()
                  : t('common.and').toLowerCase()}
              </Text>
              <TokenLinkCell token={row?.token1} hideLogo={media.lg} />
            </Text>
          )
          return (
            <Cell
              loading={showLoadingSkeleton}
              justifyContent="flex-start"
              {...(media.lg ? FLUSH_CELL_PADDING : undefined)}
            >
              {media.lg ? (
                <CollapsibleCellLayout
                  flush
                  gapPx={8}
                  logo={
                    <PortfolioLogo
                      chainId={chainInfo.id}
                      images={[row?.token0.logoUrl, row?.token1.logoUrl]}
                      fallbackSymbols={[row?.token0.symbol, row?.token1.symbol]}
                      size={EXPANDED_LOGO_SIZE}
                    />
                  }
                >
                  {pair}
                </CollapsibleCellLayout>
              ) : (
                pair
              )}
            </Cell>
          )
        },
      }),
      columnHelper.accessor((transaction) => transaction, {
        id: 'fiat-value',
        maxSize: 125,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {activeLocalCurrency}
            </Text>
          </HeaderCell>
        ),
        cell: (transaction) => (
          <Cell loading={showLoadingSkeleton}>
            <AnimatedNumber
              numericValue={transaction.getValue?.().usdValue}
              textVariant="$body2"
              value={transaction.getValue?.().usdValueFormatted}
            />
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
      columnHelper.accessor((transaction) => transaction, {
        id: 'maker-address',
        maxSize: 150,
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2">
              {t('common.wallet.label')}
            </Text>
          </HeaderCell>
        ),
        cell: (transaction) => {
          const row = transaction.getValue?.()
          const address = row?.account
          const shortenedAddress = shortenAddress({ address })

          return (
            <Cell loading={showLoadingSkeleton}>
              <WalletHoverCard address={address} chainId={row?.chainId ?? chainInfo.id}>
                <InternalLink to={buildPortfolioUrl({ externalAddress: address })}>
                  <TableText>{shortenedAddress}</TableText>
                </InternalLink>
              </WalletHoverCard>
            </Cell>
          )
        },
      }),
    ]
    return filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> => Boolean(column))
  }, [
    activeLocalCurrency,
    chainInfo.id,
    media.lg,
    filter,
    getTransactionTypeTranslation,
    filterModalIsOpen,
    formatNumberOrString,
    showLoadingSkeleton,
    t,
  ])

  return (
    <Trace section={SectionName.ExploreRecentTransactions}>
      <Table
        mobileFullBleed
        virtualized
        columns={columns}
        data={filteredTransactionsWithFiat}
        loading={allDataStillLoading}
        error={hasError}
        loadMore={loadMore}
        maxWidth={1200}
        defaultPinnedColumns={['timestamp', 'swap-type']}
        getRowId={(row) => row.id}
        // Mobile: the pinned type column (the only pinned one once `timestamp` is hidden) collapses to its pair logo on horizontal scroll.
        collapsiblePinnedColumnId={media.lg ? 'swap-type' : undefined}
      />
    </Trace>
  )
})
