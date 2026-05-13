import { useNavigate } from 'react-router'
import { useMedia } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { NetworkFilter } from '~/components/NetworkFilter/NetworkFilter'
import { useExploreParams } from '~/pages/Explore/redirects'
import { ExploreTab } from '~/types/explore'
import { getChainIdFromChainUrlParam, getChainUrlParam } from '~/utils/params/chainParams'

function buildExploreUrl(tabName: ExploreTab | undefined, chainId: UniverseChainId | undefined): string {
  const chainUrlParam = chainId ? getChainUrlParam(chainId) : ''
  return `/explore/${tabName ?? ExploreTab.Tokens}${chainId ? `/${chainUrlParam}` : ''}`
}

export function TableNetworkFilter({ networks }: { networks?: UniverseChainId[] } = {}) {
  const navigate = useNavigate()
  const media = useMedia()
  const { tab: tabName, chainName } = useExploreParams()
  const currentChainId = chainName ? getChainIdFromChainUrlParam(chainName) : undefined

  const onNetworkPress = useEvent((chainId: UniverseChainId | undefined) => {
    navigate(buildExploreUrl(tabName, chainId))
  })

  return (
    <NetworkFilter
      showMultichainOption={tabName !== ExploreTab.Transactions}
      position={media.lg ? 'left' : 'right'}
      onPress={onNetworkPress}
      currentChainId={currentChainId}
      networks={networks}
      tab={tabName}
      tracePage={InterfacePageName.ExplorePage}
    />
  )
}
