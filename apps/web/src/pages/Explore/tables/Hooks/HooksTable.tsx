import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { SharedEventName } from '@uniswap/analytics-events'
import type { UniverseChainId } from '@universe/chains'
import { Flex, Text, useMedia } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useHookRegistryMap } from 'uniswap/src/features/poolHooks/hooks/useHookRegistryMap'
import { useUniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ALL_NETWORKS_LABEL } from 'uniswap/src/features/telemetry/types'
import { Table } from '~/components/Table'
import { useEffectiveVolumeTimePeriod } from '~/features/Explore/hooks/useEffectiveVolumeTimePeriod'
import { useInfiniteLoadMore } from '~/features/Explore/hooks/useInfiniteLoadMore'
import { EXPLORE_API_PAGE_SIZE } from '~/features/Explore/state/constants'
import { HookResultsPagination } from '~/features/Hooks/components/HookResultsPagination'
import { getActiveHookFilters } from '~/features/Hooks/hookFilters'
import { getUniqueHooks, hookListInfiniteQueryOptions, hookListSummaryQueryOptions } from '~/features/Hooks/queries'
import { HooksFixtureScenario } from '~/features/Hooks/types'
import { POOLS_FILTER_TVL_BUCKETS } from '~/features/Liquidity/PoolsFilter/constants'
import { getHookSortAnalyticsValue } from '~/pages/Explore/tables/Hooks/getHookSortAnalyticsValue'
import { getHookTableRow } from '~/pages/Explore/tables/Hooks/getHookTableRow'
import { HooksSummaryCards } from '~/pages/Explore/tables/Hooks/HooksSummaryCards'
import { getHooksTableColumns } from '~/pages/Explore/tables/Hooks/hooksTableColumns'
import { HooksTableFilters } from '~/pages/Explore/tables/Hooks/HooksTableFilters'
import type { HookTableRow } from '~/pages/Explore/tables/Hooks/hooksTableTypes'
import { getHookVolumePeriod, HOOK_VOLUME_PERIODS } from '~/pages/Explore/tables/Hooks/hooksVolumePeriods'
import { useHooksTableUrlState } from '~/pages/Explore/tables/Hooks/useHooksTableUrlState'

export function HooksTable({
  scenario,
  chainId,
}: {
  scenario: HooksFixtureScenario
  chainId?: UniverseChainId
}): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const [searchParams] = useSearchParams()
  const { search, searchDraft, setSearch, sortField, sortDirection, setSort, filters, setFilters } =
    useHooksTableUrlState()
  const timePeriod = useEffectiveVolumeTimePeriod(HOOK_VOLUME_PERIODS)
  const period = getHookVolumePeriod(timePeriod)
  const tvlRange = POOLS_FILTER_TVL_BUCKETS.find((bucket) => bucket.id === filters.tvlBucketId)?.range
  const getTrustedProvenance = useUniswapHookProvenance()
  const summaryQuery = useQuery(hookListSummaryQueryOptions({ scenario }))
  const {
    data,
    isPending,
    isFetching,
    isPlaceholderData,
    isError,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(
    hookListInfiniteQueryOptions({
      pageSize: EXPLORE_API_PAGE_SIZE,
      scenario,
      chainId,
      search,
      sortField,
      sortDirection,
      period,
      tvlRange,
      filters: {
        routedOnly: filters.routedOnly,
        verifiedSourceOnly: filters.verifiedSourceOnly,
        metadataOnly: filters.metadataOnly,
      },
    }),
  )
  const displayedContext = useMemo(
    () => data?.pages[0]?.options ?? { chainId, search, sortField, sortDirection, period },
    [data?.pages, chainId, search, sortField, sortDirection, period],
  )

  const hooks = useMemo(() => getUniqueHooks(data?.pages ?? []), [data?.pages])
  const registryMap = useHookRegistryMap({
    chainId: displayedContext.chainId,
    enabled: hooks.some((hook) => !hook.isFixture && !hook.name?.trim()),
  })
  const loadMore = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage: hasNextPage && !isPlaceholderData,
    isFetchingNextPage,
  })
  const rows = useMemo(() => {
    const visibleRows: HookTableRow[] = []
    for (const hook of hooks) {
      const row = getHookTableRow({
        ...displayedContext,
        searchParams,
        hook,
        position: visibleRows.length + 1,
        registryMap,
        getTrustedProvenance,
      })
      if (row) {
        visibleRows.push(row)
      }
    }
    return visibleRows
  }, [displayedContext, getTrustedProvenance, hooks, registryMap, searchParams])
  const columns = useMemo(
    () =>
      getHooksTableColumns({
        t,
        mobile: media.md,
        narrow: media.xxs,
        period: displayedContext.period,
        sortField: displayedContext.sortField,
        sortDirection: displayedContext.sortDirection,
        onSort: setSort,
      }),
    [displayedContext, media.md, media.xxs, setSort, t],
  )

  return (
    <Trace
      logImpression
      eventOnTrigger={SharedEventName.PAGE_VIEWED}
      page={InterfacePageName.HooksListPage}
      properties={{
        chain: chainId ?? ALL_NETWORKS_LABEL,
        sort: getHookSortAnalyticsValue({ period, sortField, sortDirection }),
        filters: getActiveHookFilters(filters),
      }}
    >
      <Flex gap="$spacing24" width="100%" minWidth={0} testID={TestID.HooksPreview}>
        <Helmet>
          <title>{t('hooks.preview.pageTitle')}</title>
          <meta name="description" content={t('hooks.preview.description')} />
          <meta property="og:description" content={t('hooks.preview.description')} />
        </Helmet>
        <Text tag="h1" className="sr-only">
          {t('hooks.title')}
        </Text>
        <HooksSummaryCards
          summary={summaryQuery.data}
          loading={summaryQuery.isPending}
          error={summaryQuery.isError && !summaryQuery.data}
          onRetry={() => {
            void summaryQuery.refetch()
          }}
        />
        <HooksTableFilters
          chainId={chainId}
          search={searchDraft}
          onSearchChange={setSearch}
          filters={filters}
          onFiltersApply={setFilters}
        />
        <Flex aria-busy={isFetching} minWidth={0}>
          <Table
            columns={columns}
            data={rows}
            loading={isPending}
            error={isError && !data}
            errorState={{ onRetry: refetch }}
            emptyState={{
              title: scenario === HooksFixtureScenario.NotFound ? t('hooks.preview.notFound') : t('hook.search.empty'),
            }}
            getRowId={(row) => row.id}
            loadingRowsCount={EXPLORE_API_PAGE_SIZE}
            rowHeight={64}
            compactRowHeight={56}
            maxWidth={1200}
            defaultPinnedColumns={['identity']}
            windowScrollY
            loadMore={hasNextPage && !isFetchNextPageError && !isPlaceholderData ? loadMore : undefined}
          />
        </Flex>
        {isFetchNextPageError && (
          <HookResultsPagination
            loading={isFetchingNextPage}
            disabled={isPlaceholderData}
            error={t('hooks.list.paginationError')}
            onPress={() => {
              void fetchNextPage()
            }}
          />
        )}
      </Flex>
    </Trace>
  )
}
