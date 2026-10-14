import { UniverseChainId } from '@universe/chains'
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
import { SearchBar } from '~/pages/Explore/SearchBar'
import { ExploreTab } from '~/types/explore'
import type { PoolsFilterState } from '~/types/poolsFilter'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/**
 * Filter controls in the Explore tables toolbar. The Pools tab uses the shared {@link PoolsFilter}
 * (search + Filter modal); the other tabs render their own network / search controls.
 */
export function ExploreTableFilters({
  currentKey,
  tabSupportedNetworks,
}: {
  currentKey: ExploreTab
  tabSupportedNetworks: UniverseChainId[]
}): JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlChainId = useChainIdFromUrlParam()
  const poolsFilter = useExploreTablesFilterStore((s) => s.poolsFilter)
  // Published by the Pools table from its loaded rows (see ExploreTopPoolTableContent).
  const poolsAprRange = useExploreTablesFilterStore((s) => s.poolsAprRange)
  const { setPoolsFilter } = useExploreTablesFilterStoreActions()

  // The chain lives in the URL path (`/explore/pools/<chain>`), where the other tabs' TableNetworkFilter
  // keeps it too, so a chain-filtered Pools view is linkable and the page title / stats header
  // agree with the table. The store's type refuses a chain, so only the non-chain fields go there.
  const poolsFilterValue = useMemo(() => ({ ...poolsFilter, chainId: urlChainId }), [poolsFilter, urlChainId])
  const applyPoolsFilter = useEvent(({ chainId, ...rest }: PoolsFilterState) => {
    setPoolsFilter(rest)
    if (chainId !== urlChainId) {
      navigate(buildExploreUrl({ tabName: currentKey, chainId, searchParams }))
    }
  })

  if (currentKey === ExploreTab.Pools) {
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
      {currentKey !== ExploreTab.Toucan && <SearchBar tab={currentKey} />}
    </>
  )
}
