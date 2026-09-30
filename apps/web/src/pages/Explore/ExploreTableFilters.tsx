import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useEvent } from 'utilities/src/react/hooks'
import {
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { buildExploreUrl } from '~/features/Explore/utils/buildExploreUrl'
import { VolumeTimeFrameSelector } from '~/features/Explore/VolumeTimeFrameSelector'
import { PoolsFilter } from '~/features/Liquidity/PoolsFilter/PoolsFilter'
import { TableNetworkFilter } from '~/pages/Explore/NetworkFilter'
import { ExploreProtocolFilter } from '~/pages/Explore/ProtocolFilter'
import { SearchBar } from '~/pages/Explore/SearchBar'
import { ExploreTab } from '~/types/explore'
import type { PoolsFilterState } from '~/types/poolsFilter'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/**
 * Filter controls in the Explore tables toolbar. On the Pools tab with the `AdvancedPoolsFiltering`
 * flag on, this collapses to the shared {@link PoolsFilter} (search + Filter modal); otherwise it
 * renders the existing per-tab network / protocol / search controls.
 */
export function ExploreTableFilters({
  currentKey,
  tabSupportedNetworks,
}: {
  currentKey: ExploreTab
  tabSupportedNetworks: UniverseChainId[]
}): JSX.Element {
  const isAdvancedPoolsFilteringEnabled = useFeatureFlag(FeatureFlags.AdvancedPoolsFiltering)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlChainId = useChainIdFromUrlParam()
  const poolsFilter = useExploreTablesFilterStore((s) => s.poolsFilter)
  // Published by the Pools table from its loaded rows (see ExploreTopPoolTableContent).
  const poolsAprRange = useExploreTablesFilterStore((s) => s.poolsAprRange)
  const { setPoolsFilter } = useExploreTablesFilterStoreActions()

  // The chain lives in the URL path (`/explore/pools/<chain>`), where the flag-off TableNetworkFilter and
  // the other tabs keep it, so a chain-filtered Pools view is linkable and the page title / stats header
  // agree with the table. The store's type refuses a chain, so only the non-chain fields go there.
  const poolsFilterValue = useMemo(() => ({ ...poolsFilter, chainId: urlChainId }), [poolsFilter, urlChainId])
  const applyPoolsFilter = useEvent(({ chainId, ...rest }: PoolsFilterState) => {
    setPoolsFilter(rest)
    if (chainId !== urlChainId) {
      navigate(buildExploreUrl({ tabName: currentKey, chainId, searchParams }))
    }
  })

  if (currentKey === ExploreTab.Pools && isAdvancedPoolsFilteringEnabled) {
    return (
      <PoolsFilter
        search={<SearchBar tab={currentKey} />}
        value={poolsFilterValue}
        onApply={applyPoolsFilter}
        aprRange={poolsAprRange}
        networks={tabSupportedNetworks}
      />
    )
  }

  return (
    <>
      {currentKey !== ExploreTab.Toucan && <TableNetworkFilter networks={tabSupportedNetworks} />}
      {currentKey === ExploreTab.Tokens && <VolumeTimeFrameSelector />}
      {currentKey === ExploreTab.Pools && <ExploreProtocolFilter />}
      {currentKey !== ExploreTab.Toucan && <SearchBar tab={currentKey} />}
    </>
  )
}
