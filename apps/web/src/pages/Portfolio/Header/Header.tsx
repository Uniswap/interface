import NetworkFilter from 'components/NetworkFilter/NetworkFilter'
import { usePortfolioParams } from 'pages/Portfolio/Header/hooks/usePortfolioParams'
import PortfolioAddressDisplay from 'pages/Portfolio/Header/PortfolioAddressDisplay/PortfolioAddressDisplay'
import { PortfolioTabs } from 'pages/Portfolio/Header/Tabs'
import { PortfolioTab } from 'pages/Portfolio/types'
import { useNavigate } from 'react-router'
import { Flex } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme/heights'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'
import { getChainUrlParam } from 'utils/chainParams'

function buildPortfolioUrl(tab: PortfolioTab | undefined, chainId: UniverseChainId | undefined): string {
  const chainUrlParam = chainId ? getChainUrlParam(chainId) : ''
  const currentPath = tab === PortfolioTab.Overview ? '/portfolio' : `/portfolio/${tab}`
  return `${currentPath}${chainId ? `?chain=${chainUrlParam}` : ''}`
}

export default function PortfolioHeader() {
  const navigate = useNavigate()
  const { tab, chainId: currentChainId } = usePortfolioParams()

  const onNetworkPress = useEvent((chainId: UniverseChainId | undefined) => {
    navigate(buildPortfolioUrl(tab, chainId))
  })

  return (
    <Flex
      backgroundColor="$surface1"
      paddingTop="$spacing40"
      zIndex="$header"
      paddingBottom="$spacing16"
      $platform-web={{
        position: 'sticky',
        top: INTERFACE_NAV_HEIGHT,
      }}
      gap="$spacing40"
    >
      <Flex gap="$spacing16">
        <Flex row gap="$spacing12" justifyContent="space-between">
          <PortfolioAddressDisplay />

          <NetworkFilter
            showMultichainOption={true}
            showDisplayName={true}
            position="right"
            onPress={onNetworkPress}
            currentChainId={currentChainId}
          />
        </Flex>
      </Flex>

      <PortfolioTabs />
    </Flex>
  )
}
