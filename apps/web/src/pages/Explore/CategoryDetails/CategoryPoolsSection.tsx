import { Platform, type UniverseChainId } from '@universe/chains'
import { Button, Flex, Text, useMedia } from '@universe/mycelium'
import { Plus } from '@universe/mycelium/icons/Plus'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'
import { useEvent } from 'utilities/src/react/hooks'
import { OrderDirection } from '~/data/util'
import {
  ExploreTablesFilterStoreContextProvider,
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { usePoolsAprRange } from '~/features/Liquidity/PoolsFilter/aprRange'
import { PoolsFilter } from '~/features/Liquidity/PoolsFilter/PoolsFilter'
import { ADD_LIQUIDITY_PATH } from '~/pages/AddLiquidity/poolLinkParams'
import { getExplorePoolsURL, isCategoryUnsupportedChain } from '~/pages/Explore/categories/useExploreCategory'
import { useListPools } from '~/pages/Explore/hooks/useListPools'
import { SearchBar } from '~/pages/Explore/SearchBar'
import { PoolsTable } from '~/pages/Explore/tables/Pools/PoolTable'
import { PoolTableStoreContextProvider, usePoolTableStore } from '~/pages/Explore/tables/Pools/poolTableStore'
import { ExploreTab } from '~/types/explore'
import type { PoolsFilterState } from '~/types/poolsFilter'
import { getChainFilterFromSearchParams, withChainSearchParam } from '~/utils/params/chainQueryParam'

function CategoryPoolsTable({
  categoryId,
  chainId,
}: {
  categoryId: string
  chainId: UniverseChainId | undefined
}): JSX.Element {
  const { sortMethod, sortAscending } = usePoolTableStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const poolsFilter = useExploreTablesFilterStore((s) => s.poolsFilter)
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const { setPoolsAprRange } = useExploreTablesFilterStoreActions()

  const {
    pools,
    isLoading,
    isError,
    loadMore,
    chainId: listChainId,
  } = useListPools({
    sortState: { sortBy: sortMethod, sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc },
    chainId,
    poolsFilter,
    categoryId,
  })

  // Same hand-off as the Explore table: the filter modal reads the loaded rows' APR range for its placeholders.
  const aprRange = usePoolsAprRange(pools)
  useEffect(() => {
    setPoolsAprRange(aprRange)
    return () => setPoolsAprRange(undefined)
  }, [aprRange, setPoolsAprRange])

  return (
    <PoolsTable
      mobileFullBleed
      pools={pools}
      loading={isLoading}
      error={isError}
      loadMore={loadMore}
      chainId={listChainId}
      surface="category-details"
      scopedCategoryId={categoryId}
      filterString={filterString}
      virtualized
    />
  )
}

/** Search box plus the advanced filter modal; the chain lives in `?chain=` so a filtered view is linkable. */
function CategoryPoolsFilter({
  chainId,
  networks,
  onChainChange,
}: {
  chainId: UniverseChainId | undefined
  networks: UniverseChainId[]
  onChainChange: (chainId: UniverseChainId | undefined) => void
}): JSX.Element {
  const poolsFilter = useExploreTablesFilterStore((s) => s.poolsFilter)
  const poolsAprRange = useExploreTablesFilterStore((s) => s.poolsAprRange)
  const { setPoolsFilter } = useExploreTablesFilterStoreActions()

  const value = useMemo(() => ({ ...poolsFilter, chainId }), [poolsFilter, chainId])
  const onApply = useEvent(({ chainId: nextChainId, ...rest }: PoolsFilterState) => {
    setPoolsFilter(rest)
    if (nextChainId !== chainId) {
      onChainChange(nextChainId)
    }
  })

  return (
    <PoolsFilter
      search={<SearchBar tab={ExploreTab.Pools} />}
      value={value}
      onApply={onApply}
      aprRange={poolsAprRange}
      networks={networks}
    />
  )
}

export function CategoryPoolsSection({ category }: { category: PoolCategory }): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { chainId: chainIdParam } = getChainFilterFromSearchParams(searchParams)
  // Categories only cover EVM chains: offer only those, and read a deep link to another chain as All networks.
  const chainId = isCategoryUnsupportedChain(chainIdParam) ? undefined : chainIdParam
  const { chains: networks } = useEnabledChains({ platform: Platform.EVM, includeTestnets: true })
  const onChainChange = useEvent((nextChainId: UniverseChainId | undefined) =>
    setSearchParams(withChainSearchParam(searchParams, nextChainId), { replace: true }),
  )
  const onNewPosition = useEvent(() => navigate(ADD_LIQUIDITY_PATH, { state: { entryPoint: getExplorePoolsURL() } }))
  const poolCount = category.stats?.poolCount

  return (
    <ExploreTablesFilterStoreContextProvider>
      <PoolTableStoreContextProvider key={category.id}>
        <Flex width="100%" gap="$spacing4">
          <Flex
            row
            width="100%"
            alignItems="center"
            justifyContent="space-between"
            gap="$spacing12"
            $md={{ row: false, flexDirection: 'column', alignItems: 'flex-start' }}
          >
            <Text variant="subheading1" color="$neutral1">
              {poolCount !== undefined && t('categoryDetails.poolCount', { count: poolCount })}
            </Text>
            <Flex row gap="$spacing8" alignItems="center" $md={{ width: '100%' }}>
              <Trace logPress element={ElementName.ExplorePoolsNewPosition}>
                <Button size="small" icon={<Plus />} onPress={onNewPosition}>
                  {media.sm ? t('common.new') : t('pool.newPosition.title')}
                </Button>
              </Trace>
              <CategoryPoolsFilter chainId={chainId} networks={networks} onChainChange={onChainChange} />
            </Flex>
          </Flex>
          <CategoryPoolsTable categoryId={category.id} chainId={chainId} />
        </Flex>
      </PoolTableStoreContextProvider>
    </ExploreTablesFilterStoreContextProvider>
  )
}
