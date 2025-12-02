import NetworkFilter from 'components/NetworkFilter/NetworkFilter'
import { TOTAL_INTERFACE_NAV_HEIGHT } from 'pages/Portfolio/constants'
import { usePortfolioRoutes } from 'pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { PortfolioAddressDisplay } from 'pages/Portfolio/Header/PortfolioAddressDisplay/PortfolioAddressDisplay'
import { PortfolioTabs } from 'pages/Portfolio/Header/Tabs'
import { useShouldHeaderBeCompact } from 'pages/Portfolio/Header/useShouldHeaderBeCompact'
import { PortfolioTab } from 'pages/Portfolio/types'
import { useNavigate } from 'react-router'
import { Flex, useMedia } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'
import { getChainUrlParam } from 'utils/chainParams'

const HEADER_TRANSITION = 'all 0.2s ease'

function buildPortfolioUrl(tab: PortfolioTab | undefined, chainId: UniverseChainId | undefined): string {
  const chainUrlParam = chainId ? getChainUrlParam(chainId) : ''
  const currentPath = tab === PortfolioTab.Overview ? '/portfolio' : `/portfolio/${tab}`
  return `${currentPath}${chainId ? `?chain=${chainUrlParam}` : ''}`
}

interface PortfolioHeaderProps {
  scrollY?: number
}

export function PortfolioHeader({ scrollY }: PortfolioHeaderProps) {
  const navigate = useNavigate()
  const media = useMedia()
  const { tab, chainId: currentChainId } = usePortfolioRoutes()
  const isCompact = useShouldHeaderBeCompact(scrollY)
  const onNetworkPress = useEvent((chainId: UniverseChainId | undefined) => {
    navigate(buildPortfolioUrl(tab, chainId))
  })

  return (
    <Flex
      backgroundColor="$surface1"
      marginTop="$spacing24"
      paddingTop="$spacing16"
      zIndex="$header"
      $platform-web={{
        position: 'sticky',
        top: TOTAL_INTERFACE_NAV_HEIGHT,
      }}
      gap={isCompact ? '$gap12' : '$spacing40'}
      transition="gap 200ms ease"
    >
      <Flex gap="$spacing16">
        <Flex row gap="$spacing12" justifyContent="space-between" alignItems="center">
          <PortfolioAddressDisplay isCompact={isCompact} />

          <NetworkFilter
            showMultichainOption
            showDisplayName={!media.sm}
            position="right"
            onPress={onNetworkPress}
            currentChainId={currentChainId}
            size={media.md || isCompact ? 'small' : 'medium'}
            transition={HEADER_TRANSITION}
          />
        </Flex>
      </Flex>

      <PortfolioTabs />
    </Flex>
  )
}
