import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import PortfolioActivity from 'pages/Portfolio/Activity/Activity'
import { PortfolioDefi } from 'pages/Portfolio/Defi'
import { usePortfolioRoutes } from 'pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioTabsAnimation } from 'pages/Portfolio/Header/hooks/usePortfolioTabsAnimation'
import { PortfolioNfts } from 'pages/Portfolio/NFTs/Nfts'
import { PortfolioOverview } from 'pages/Portfolio/Overview/Overview'
import { PortfolioTokens } from 'pages/Portfolio/Tokens/Tokens'
import { PortfolioTab } from 'pages/Portfolio/types'
import { useLocation } from 'react-router'
import { Flex } from 'ui/src'
import { TransitionItem } from 'ui/src/animations/components/AnimatePresencePager'

const renderPortfolioContent = (tab: PortfolioTab | undefined, isPortfolioDefiTabEnabled: boolean) => {
  switch (tab) {
    case PortfolioTab.Overview:
      return <PortfolioOverview />
    case PortfolioTab.Tokens:
      return <PortfolioTokens />
    case PortfolioTab.Defi:
      // If defi tab is disabled, usePortfolioRoutes will redirect to overview tab
      return isPortfolioDefiTabEnabled ? <PortfolioDefi /> : <></>
    case PortfolioTab.Nfts:
      return <PortfolioNfts />
    case PortfolioTab.Activity:
      return <PortfolioActivity />
    default:
      return <PortfolioOverview />
  }
}

export function PortfolioContent({ disabled }: { disabled?: boolean }): JSX.Element {
  const { pathname } = useLocation()
  const animationType = usePortfolioTabsAnimation(pathname)
  const { tab } = usePortfolioRoutes()
  const isPortfolioDefiTabEnabled = useFeatureFlag(FeatureFlags.PortfolioDefiTab)

  return (
    <Flex flex={1} position="relative" $platform-web={disabled ? { pointerEvents: 'none' } : undefined}>
      <TransitionItem childKey={pathname} animationType={animationType} animation="fast">
        {renderPortfolioContent(tab, isPortfolioDefiTabEnabled)}
      </TransitionItem>
    </Flex>
  )
}
