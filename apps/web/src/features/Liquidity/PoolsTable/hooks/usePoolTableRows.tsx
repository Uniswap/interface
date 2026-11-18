import { type UniverseChainId, areEvmAddressesEqual } from '@universe/chains'
import { useMemo } from 'react'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useListPoolCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListPoolCategoriesQuery'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useHookRegistryMap } from 'uniswap/src/features/poolHooks/hooks/useHookRegistryMap'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import type { ExploreTableSurface } from 'uniswap/src/features/telemetry/types'
import { selectRowCategoryTag } from 'uniswap/src/features/tokenCategories/selectRowCategoryTag'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'
import type { LivePoolVolumePeriod } from '~/components/Charts/timeLabels'
import { PoolDescription } from '~/features/Liquidity/PoolsTable/components/PoolDescription'
import type { PoolLinkData, PoolTableLinkState, PoolTableValues } from '~/features/Liquidity/PoolsTable/types'
import {
  buildV4CurrencyId,
  formatOptionalFiatAmount,
  formatVolume,
  getPoolLink,
  getPoolVolumes,
} from '~/features/Liquidity/PoolsTable/utils/poolRowValues'
import { getPoolVolumePeriodStats } from '~/features/Liquidity/PoolsTable/utils/poolVolumePeriods'
import type { PoolStat } from '~/types/explore'

// Figma tags Explore, category page and Create Position pool browser rows; TDP and discovery rows stay plain.
const CATEGORY_TAG_SURFACES: ReadonlySet<ExploreTableSurface> = new Set([
  'explore',
  'category-details',
  'add-liquidity-pool-browser',
])
const EMPTY_POOL_CATEGORIES: PoolCategory[] = []

export function usePoolTableRows({
  pools,
  listChainId,
  surface,
  volumeTimePeriod,
  showHookBadges,
  scopedCategoryId,
  selectedPoolId,
  selectedPoolChainId,
  getLink,
  linkState,
  filterString,
  rowAnalyticsProperties,
}: {
  pools?: PoolStat[]
  listChainId: UniverseChainId | undefined
  surface: ExploreTableSurface
  volumeTimePeriod?: LivePoolVolumePeriod
  showHookBadges: boolean
  scopedCategoryId?: string
  selectedPoolId?: string
  selectedPoolChainId?: UniverseChainId
  getLink?: (pool: PoolLinkData) => string
  linkState?: PoolTableLinkState
  filterString?: string
  rowAnalyticsProperties?: Record<string, unknown>
}): PoolTableValues[] {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  // One registry fetch for the whole list (not one per row), scoped to the list's chain filter and
  // skipped when nothing listed has a hook (v2/v3-only lists, zero-address v4 hooks).
  const hasHookedPool =
    showHookBadges &&
    !!pools?.some((pool) => !!pool.hookAddress && !areEvmAddressesEqual(pool.hookAddress, ZERO_ADDRESS))
  const hookRegistry = useHookRegistryMap({ chainId: listChainId, enabled: hasHookedPool })
  // One cached ListCategories read per table; the hook also disables itself while the flag is off.
  const showCategoryTags = CATEGORY_TAG_SURFACES.has(surface)
  const { data: poolCategories = EMPTY_POOL_CATEGORIES } = useListPoolCategoriesQuery({ enabled: showCategoryTags })

  return useMemo(
    () =>
      pools?.map((pool, index) => {
        const poolSortRank = index + 1
        const chainId = pool.chainId
        const poolIdOrHash = pool.id
        const volumes = getPoolVolumes(pool)
        const periodStats =
          volumeTimePeriod !== undefined ? getPoolVolumePeriodStats(pool, volumeTimePeriod) : undefined
        // The row link is built from this same `poolIdOrHash`, so exact equality is correct — and
        // address-casing rules don't apply to v4 pool-id hashes anyway.
        const selected =
          selectedPoolId !== undefined && chainId === selectedPoolChainId && poolIdOrHash === selectedPoolId

        return {
          index: poolSortRank,
          selected,
          poolDescription: (
            <PoolDescription
              token0={pool.token0}
              token1={pool.token1}
              isToken0Quote={pool.isToken0Quote}
              chainId={chainId}
              protocolVersion={pool.protocolVersion?.toLowerCase()}
              feeTier={pool.feeTier ?? undefined}
              currentLpFeePips={pool.currentLpFeePips}
              hookAddress={showHookBadges ? pool.hookAddress : undefined}
              protocolFeePips={pool.protocolFeePips}
              hookRegistry={hookRegistry}
              categoryTag={
                showCategoryTags
                  ? selectRowCategoryTag({
                      categoryIds: pool.categoryIds,
                      categories: poolCategories,
                      skipCategoryId: scopedCategoryId,
                    })
                  : undefined
              }
            />
          ),
          tvl: formatOptionalFiatAmount(pool.totalLiquidity?.value, convertFiatAmountFormatted),
          volume24h: formatVolume(volumes.volume24h, convertFiatAmountFormatted),
          volume30d: formatVolume(volumes.volume30d, convertFiatAmountFormatted),
          selectedVolume: formatOptionalFiatAmount(periodStats?.volume, convertFiatAmountFormatted),
          volOverTvl: periodStats ? periodStats.volOverTvl : pool.volOverTvl,
          apr: pool.apr,
          totalApr: pool.totalApr,
          rewards: pool.rewards,
          link: getPoolLink(pool, { chainId, linkBuilder: getLink }),
          linkState,
          ...buildV4CurrencyId(pool, chainId),
          analytics: {
            elementName: ElementName.PoolsTableRow,
            properties: {
              ...rowAnalyticsProperties,
              chain_id: chainId,
              pool_address: poolIdOrHash,
              token0_address: pool.token0?.address,
              token0_symbol: pool.token0?.symbol,
              token1_address: pool.token1?.address,
              token1_symbol: pool.token1?.symbol,
              pool_list_index: index,
              pool_list_rank: poolSortRank,
              pool_list_length: pools.length,
              search_pool_input: filterString,
            },
          },
        }
      }) ?? [],
    [
      convertFiatAmountFormatted,
      hookRegistry,
      filterString,
      getLink,
      linkState,
      pools,
      selectedPoolId,
      selectedPoolChainId,
      showCategoryTags,
      poolCategories,
      scopedCategoryId,
      showHookBadges,
      rowAnalyticsProperties,
      volumeTimePeriod,
    ],
  )
}
