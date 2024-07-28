import { ApolloError } from '@apollo/client'
import { createColumnHelper } from '@tanstack/react-table'
import Row from 'components/Row'
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
import { useChainFromUrlParam } from 'constants/chains'
import { useUpdateManualOutage } from 'featureFlags/flags/outageBanner'
import { BETypeToTransactionType, TransactionType, useAllTransactions } from 'graphql/data/useAllTransactions'
import { OrderDirection, getSupportedGraphQlChain } from 'graphql/data/util'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { Trans } from 'i18n'
import { useMemo, useReducer, useState } from 'react'
import { ThemedText } from 'theme/components'
// import {
//   PoolTransaction,
//   PoolTransactionType,
// } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { shortenAddress } from 'utilities/src/addresses'
import { useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

export default function RecentTransactions() {
  const activeLocalCurrency = useActiveLocalCurrency()
  const { formatNumber, formatFiatPrice } = useFormatter()
  const [filterModalIsOpen, toggleFilterModal] = useReducer((s) => !s, false)
  const [filter, setFilters] = useState<TransactionType[]>([
    TransactionType.SWAP,
    TransactionType.BURN,
    TransactionType.MINT,
  ])
  const chain = getSupportedGraphQlChain(useChainFromUrlParam(), { fallbackToEthereum: true })

  const { transactions, loading, loadMore, errorV2, errorV3 } = useAllTransactions(chain.backendChain.chain, filter)
  const combinedError =
    errorV2 && errorV3 && undefined
  const allDataStillLoading = loading && !transactions.length
  console.log("combinedError", combinedError)
  const showLoadingSkeleton = allDataStillLoading || !!combinedError
  useUpdateManualOutage({ chainId: chain.id, errorV3, errorV2 })
  // TODO(WEB-3236): once GQL BE Transaction query is supported add usd, token0 amount, and token1 amount sort support

  const LiquidityIncentives = [
    {
      pool: 'AZUR/WETH',
      duration: '19/JUN/2024 13:00 - 19/SEP/2024 13:00',
      vesting: '30 days',
      tvl: '$1,000,000',
      totalrewards: '600,000 AZUR',
      tokenreward: 'AZUR',
    },
    {
      pool: 'WETH/LAKE',
      duration: '31/AUG/2023 13:00 - 30/AUG/2024 13:00',
      vesting: '30 days',
      tvl: '$1,000,000',
      totalrewards: '600,000 LAKE',
      tokenreward: 'LAKE',
    },
    {
      pool: 'WMINIMA/USDT',
      duration: '15/FEB/2024 13:00 - 14/AUG/2024 13:00',
      vesting: '30 days',
      tvl: '$1,000,000',
      totalrewards: '600,000 WMINIMA',
      tokenreward: 'WMINIMA',
    },
    {
      pool: 'LINK/SDL',
      duration: '1/APR/2024 13:00 - 28/SEP/2024 13:00',
      vesting: '30 days',
      tvl: '$1,000,000',
      totalrewards: '600,000 SDL',
      tokenreward: 'SDL',
    },
    {
      pool: 'TKB/WETH',
      duration: '4/AUG/2024 13:00 - 1/AUG/2025 13:00',
      vesting: '30 days',
      tvl: '$1,000,000',
      totalrewards: '600,000 TKB',
      tokenreward: 'TKB',
    },
  ];

  interface PoolTransaction {
    pool: string;
    duration: string;
    vesting: string;
    tvl: string;
    totalrewards: string;
    tokenreward: string;
  }

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolTransaction>();
    return [
      columnHelper.accessor('pool', {
        id: 'pool',
        header: () => (
          <Cell minWidth={200} justifyContent="flex-start" grow>
            <Row gap="4px">
              <ThemedText.BodySecondary>
                <Trans i18nKey="common.incentives.pool.fee" />
              </ThemedText.BodySecondary>
            </Row>
          </Cell>
        ),
        cell: (pool) => (
          <Cell loading={showLoadingSkeleton} minWidth={200} justifyContent="flex-start" grow>
            {pool.getValue?.()}
          </Cell>
        ),
      }),
      columnHelper.accessor('duration', {
        id: 'duration',
        header: () => (
          <Cell minWidth={200} justifyContent="flex-start" grow>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.duration" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (duration) => (
          <Cell loading={showLoadingSkeleton} minWidth={200} justifyContent="flex-start" grow>
            {duration.getValue?.()}
          </Cell>
        ),
      }),
      columnHelper.accessor('vesting', {
        id: 'vesting',
        header: () => (
          <Cell minWidth={150}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.vesting" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (vesting) => (
          <Cell loading={showLoadingSkeleton} minWidth={150}>
            {vesting.getValue?.()}
          </Cell>
        ),
      }),
      columnHelper.accessor('tvl', {
        id: 'tvl',
        header: () => (
          <Cell minWidth={200}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.pool.tvl" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (tvl) => (
          <Cell loading={showLoadingSkeleton} minWidth={200}>
            {tvl.getValue?.()}
          </Cell>
        ),
      }),
      columnHelper.accessor('totalrewards', {
        id: 'totalreward',
        header: () => (
          <Cell minWidth={200}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.total.program.rewards" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (totalreward) => (
          <Cell loading={showLoadingSkeleton} minWidth={200}>
            {totalreward.getValue?.()}
          </Cell>
        ),
      }),
      columnHelper.accessor('tokenreward', {
        id: 'tokenreward',
        header: () => (
          <Cell minWidth={150}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.token.reward" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (tokenreward) => (
          <Cell loading={showLoadingSkeleton} minWidth={150}>
            {tokenreward.getValue?.()}
          </Cell>
        ),
      }),
    ];
  }, [showLoadingSkeleton]);

  return (
    <Table
      columns={columns}
      data={LiquidityIncentives}
      loading={allDataStillLoading}
      error={combinedError}
      loadMore={loadMore}
      maxWidth={1200}
    />
  );
}