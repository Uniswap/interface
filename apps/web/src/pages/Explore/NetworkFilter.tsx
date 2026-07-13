import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useNavigate, useSearchParams } from 'react-router'
import { useMedia } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { NetworkFilter } from '~/components/NetworkFilter/NetworkFilter'
import { useExploreParams } from '~/pages/Explore/redirects'
import { ExploreTab } from '~/types/explore'
import { getChainIdFromChainUrlParam, getChainUrlParam } from '~/utils/params/chainParams'

function buildExploreUrl({
  tabName,
  chainId,
  searchParams,
}: {
  tabName: ExploreTab | undefined
  chainId: UniverseChainId | undefined
  searchParams: URLSearchParams
}): string {
  const chainUrlParam = chainId ? getChainUrlParam(chainId) : ''
  const path = `/explore/${tabName ?? ExploreTab.Tokens}${chainId ? `/${chainUrlParam}` : ''}`
  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

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
      onPress={onNetworkPress}
      currentChainId={currentChainId}
      networks={networks}
      tab={tabName}
      tracePage={InterfacePageName.ExplorePage}
      showSearch={isNetworkFilterV2Enabled}
    />
  )
}
