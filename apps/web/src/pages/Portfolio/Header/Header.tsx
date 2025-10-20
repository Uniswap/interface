import NetworkFilter from 'components/NetworkFilter/NetworkFilter'
import { useAccount } from 'hooks/useAccount'
import { useScroll } from 'hooks/useScroll'
import { usePortfolioParams } from 'pages/Portfolio/Header/hooks/usePortfolioParams'
import { PortfolioTabs } from 'pages/Portfolio/Header/Tabs'
import { PortfolioTab } from 'pages/Portfolio/types'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Flex } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme/heights'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
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
  const { height: scrollHeight } = useScroll()
  const [isCompact, setIsCompact] = useState(false)
  const account = useAccount()

  useEffect(() => {
    setIsCompact((prevIsCompact) => {
      if (!prevIsCompact && scrollHeight > 120) {
        return true
      }
      if (prevIsCompact && scrollHeight < 80) {
        return false
      }
      return prevIsCompact
    })
  }, [scrollHeight])

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
          <AddressDisplay
            size={isCompact ? 24 : 48}
            showCopy
            address={account.address ?? ''}
            hideAddressInSubtitle={isCompact}
            addressNumVisibleCharacters={4}
            accountIconTransition="all 0.3s ease"
          />
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
