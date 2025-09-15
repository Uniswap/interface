import NetworkFilter from 'components/NetworkFilter/NetworkFilter'
import { ExploreTab } from 'pages/Explore/constants'
import { useExploreParams } from 'pages/Explore/redirects'
import { useNavigate } from 'react-router'
import { useMedia } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'
import { getChainIdFromChainUrlParam, getChainUrlParam } from 'utils/chainParams'

function buildExploreUrl(tabName: ExploreTab | undefined, chainId: UniverseChainId | undefined): string {
  const chainUrlParam = chainId ? getChainUrlParam(chainId) : ''
  return `/explore/${tabName ?? ExploreTab.Tokens}${chainId ? `/${chainUrlParam}` : ''}`
}

export default function TableNetworkFilter() {
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
    />
  )
}
