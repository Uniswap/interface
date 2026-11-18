import { useInfiniteQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { AddressStringFormat, normalizeAddress } from '@universe/chains'
import { Flex, Text, useMedia } from '@universe/mycelium'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LIVE_POOL_VOLUME_PERIODS } from '~/components/Charts/timeLabels'
import { useInfiniteLoadMore } from '~/components/Table/hooks/useInfiniteLoadMore'
import { PoolSortFields } from '~/data/pools/poolStats'
import { useEffectiveVolumeTimePeriod } from '~/features/Explore/hooks/useEffectiveVolumeTimePeriod'
import { VolumeTimeFrameSelector } from '~/features/Explore/VolumeTimeFrameSelector'
import { HookResultsPagination } from '~/features/Hooks/components/HookResultsPagination'
import { hookPoolsFixtureQueryOptions } from '~/features/Hooks/poolQueries'
import type { HookDeployment } from '~/features/Hooks/types'
import { useListPoolsAsPoolStats } from '~/features/Liquidity/hooks/useListPoolsAsPoolStats'
import { PoolsTable } from '~/features/Liquidity/PoolsTable/PoolsTable'
import { PoolTableStoreContextProvider, usePoolTableStore } from '~/features/Liquidity/PoolsTable/state/poolTableStore'
import { getPoolSortMethodForPeriod } from '~/features/Liquidity/PoolsTable/utils/poolVolumePeriods'
import { poolSortFieldToOrderBy } from '~/features/Liquidity/utils/convertPoolToPoolStat'
import { getPoolsListParams } from '~/features/Liquidity/utils/getPoolsListParams'
import { LIST_API_PAGE_SIZE } from '~/utils/listRequestParams'

const HIDDEN_COLUMNS = [PoolSortFields.RewardApr]
const COLUMN_ORDER = ['poolDescription', 'tvl', 'apr'] as const

interface HookDetailsPoolsTableProps {
  deployment: Pick<HookDeployment, 'chainId' | 'address'>
  isFixture: boolean
  headingId: string
}

function HookDetailsPoolsTableContent({
  deployment: { chainId, address },
  isFixture,
  headingId,
}: HookDetailsPoolsTableProps): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const period = useEffectiveVolumeTimePeriod(LIVE_POOL_VOLUME_PERIODS)
  const { sortMethod, sortAscending } = usePoolTableStore((state) => ({
    sortMethod: state.sortMethod,
    sortAscending: state.sortAscending,
  }))
  const rowAnalyticsProperties = useMemo(
    () => ({ hook_address: normalizeAddress(address, AddressStringFormat.Lowercase) }),
    [address],
  )
  const effectiveSortMethod = getPoolSortMethodForPeriod(sortMethod, period)
  const params = useMemo(
    () =>
      getPoolsListParams({
        chainId,
        fallbackChainIds: [chainId],
        hookAddress: address,
        filterParams: { protocolVersions: [ProtocolVersion.V4] },
        sort: { orderBy: poolSortFieldToOrderBy[effectiveSortMethod], ascending: sortAscending },
      }),
    [address, chainId, effectiveSortMethod, sortAscending],
  )
  const fixture = useInfiniteQuery({
    ...hookPoolsFixtureQueryOptions({
      chainId,
      hookAddress: address,
      sortMethod: effectiveSortMethod,
      sortAscending,
      period,
      pageSize: LIST_API_PAGE_SIZE,
    }),
    enabled: isFixture,
  })
  const live = useListPoolsAsPoolStats({
    params,
    pageSize: LIST_API_PAGE_SIZE,
    enabled: !isFixture,
    persist: false,
    keepPreviousRows: true,
  })
  const query = isFixture ? fixture : live
  const pools = useMemo(
    () => (isFixture ? fixture.data?.pages.flatMap((page) => page.pools) : live.pools),
    [fixture.data?.pages, isFixture, live.pools],
  )
  const {
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    isFetchNextPageError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = query
  const loadMore = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage: hasNextPage && !isPlaceholderData,
    isFetchingNextPage,
  })
  const total = isFixture ? fixture.data?.pages[0]?.total : undefined
  const hasRows = Boolean(pools?.length)
  const isRefreshError = isError && !isFetchNextPageError
  const paginationError = isError
    ? t(isRefreshError ? 'hooks.details.pools.refreshError' : 'hooks.details.pools.paginationError')
    : undefined
  const poolsLabel = t('hooks.details.pools')

  return (
    <Flex width="100%" minWidth={0} gap="$spacing16" aria-busy={isFetching}>
      {!media.md && (
        <Flex row alignItems="center" justifyContent="space-between" gap="$spacing12" minHeight={40}>
          <Flex
            id={headingId}
            tag="h2"
            row
            alignItems="center"
            gap="$spacing8"
            m={0}
            aria-label={total === undefined ? poolsLabel : `${poolsLabel} ${total}`}
          >
            <Text variant="subheading1">{poolsLabel}</Text>
            {total !== undefined && (
              <Text variant="subheading1" color="$neutral2">
                {total}
              </Text>
            )}
          </Flex>
          <Flex ml="auto">
            <VolumeTimeFrameSelector supportedPeriods={LIVE_POOL_VOLUME_PERIODS} />
          </Flex>
        </Flex>
      )}
      <PoolsTable
        pools={pools}
        chainId={chainId}
        surface="hook-details"
        showHookBadges={false}
        rowAnalyticsProperties={rowAnalyticsProperties}
        columnOrder={COLUMN_ORDER}
        loading={isLoading}
        error={isError}
        errorState={{ onRetry: refetch }}
        emptyState={{ title: t('hooks.details.pools.empty') }}
        hideIndex
        hiddenColumns={HIDDEN_COLUMNS}
        volumeTimePeriod={period}
        maxWidth={1200}
        maxHeight={600}
        mobileFullBleed
        loadMore={hasNextPage && !isFetchNextPageError && !isPlaceholderData ? loadMore : undefined}
      />
      {(isFetchNextPageError || (isRefreshError && hasRows)) && (
        <HookResultsPagination
          loading={isFetchingNextPage}
          disabled={isPlaceholderData}
          error={paginationError}
          onPress={() => {
            if (isRefreshError) {
              void refetch()
            } else {
              void fetchNextPage()
            }
          }}
        />
      )}
    </Flex>
  )
}

export function HookDetailsPoolsTable(props: HookDetailsPoolsTableProps): JSX.Element {
  return (
    <PoolTableStoreContextProvider>
      <HookDetailsPoolsTableContent {...props} />
    </PoolTableStoreContextProvider>
  )
}
