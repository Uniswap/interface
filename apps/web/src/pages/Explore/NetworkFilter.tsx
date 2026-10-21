import { UniverseChainId } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useNavigate, useSearchParams } from 'react-router'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter/NetworkFilter'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { useNetworkFilterChainIds } from '~/components/NetworkFilter/useFilteredChains'
import { buildExploreUrl } from '~/features/Explore/utils/buildExploreUrl'
import { isCategoryUnsupportedChain, withoutCategoryParam } from '~/pages/Explore/categories/useExploreCategory'
import { useExploreParams } from '~/pages/Explore/redirects'
import { ExploreTab } from '~/types/explore'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

export function TableNetworkFilter({ networks }: { networks?: UniverseChainId[] } = {}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const media = useMedia()
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const { tab: tabName, chainName } = useExploreParams()
  const currentChainId = chainName ? getChainIdFromChainUrlParam(chainName) : undefined
  const { chainIds, allNetworksChainIds } = useNetworkFilterChainIds(networks)

  const onPressChain = useEvent((pressedChainId: UniverseChainId | null) => {
    const chainId = pressedChainId ?? undefined
    // Leaving an unsupported chain drops it too: there the category read as All, so a stale param would resurface.
    const dropCategory =
      tokenCategoriesEnabled && (isCategoryUnsupportedChain(chainId) || isCategoryUnsupportedChain(currentChainId))
    navigate(
      buildExploreUrl({
        tabName,
        chainId,
        searchParams: dropCategory ? withoutCategoryParam(searchParams) : searchParams,
      }),
    )
  })

  return (
    <NetworkFilter
      trigger={{ variant: 'pill' }}
      forceAllNetworksLabel
      includeAllNetworks={tabName !== ExploreTab.Transactions}
      // Explore layouts stack the toolbar at different breakpoints, so this only picks the preferred edge.
      placement={media.lg ? 'bottom-start' : 'bottom-end'}
      chainIds={chainIds}
      allNetworksChainIds={allNetworksChainIds}
      selectedChain={currentChainId ?? null}
      selectionAnalytics={{ page: InterfacePageName.ExplorePage, tab: tabName }}
      onPressChain={onPressChain}
    />
  )
}
