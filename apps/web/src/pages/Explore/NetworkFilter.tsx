import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useNavigate, useSearchParams } from 'react-router'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { NetworkFilter } from '~/components/NetworkFilter/NetworkFilter'
import { buildExploreUrl } from '~/features/Explore/utils/buildExploreUrl'
import { useExploreParams } from '~/pages/Explore/redirects'
import { ExploreTab } from '~/types/explore'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

export function TableNetworkFilter({ networks }: { networks?: UniverseChainId[] } = {}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const media = useMedia()
  const isNetworkFilterV2Enabled = useFeatureFlag(FeatureFlags.NetworkFilterV2)
  const { tab: tabName, chainName } = useExploreParams()
  const currentChainId = chainName ? getChainIdFromChainUrlParam(chainName) : undefined

  const onNetworkPress = useEvent((chainId: UniverseChainId | undefined) => {
    navigate(buildExploreUrl({ tabName, chainId, searchParams }))
  })

  return (
    <NetworkFilter
      forceAllNetworksLabel
      showMultichainOption={tabName !== ExploreTab.Transactions}
      position={media.lg ? 'left' : 'right'}
      // The toolbar row this trigger sits in stacks to a column at different breakpoints depending on
      // which Explore layout is active (see ExploreCategoryTablesSection vs. the classic tab nav row),
      // so a single `position` breakpoint can't reliably predict the trigger's on-screen edge. Clamp
      // against the real viewport instead of guessing from `position` alone.
      positionFixed
      onPress={onNetworkPress}
      currentChainId={currentChainId}
      networks={networks}
      tab={tabName}
      tracePage={InterfacePageName.ExplorePage}
      showSearch={isNetworkFilterV2Enabled}
    />
  )
}
