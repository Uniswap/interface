import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex } from 'ui/src'
import { PortfolioConnectWalletBanner } from '~/pages/Portfolio/ConnectWalletBanner'
import { ConnectWalletFixedBottomButton } from '~/pages/Portfolio/ConnectWalletFixedBottomButton'
import { PortfolioHeader } from '~/pages/Portfolio/Header/Header'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioHeartbeatCoordinator } from '~/pages/Portfolio/hooks/usePortfolioHeartbeatCoordinator'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'
import { PortfolioContent } from '~/pages/Portfolio/PortfolioContent'
import { PortfolioOutageProvider } from '~/pages/Portfolio/PortfolioOutageContext'

interface PortfolioPageInnerProps {
  mb?: number | string
}

export function PortfolioPageInner({ mb }: PortfolioPageInnerProps): JSX.Element {
  const showDemoView = useShowDemoView()
  const { tab } = usePortfolioRoutes()
  const portfolioPoolsBalancesEnabled = useFeatureFlag(FeatureFlags.PortfolioPoolsBalances)

  usePortfolioHeartbeatCoordinator({ tab, poolsEnabled: portfolioPoolsBalancesEnabled })

  return (
    <PortfolioOutageProvider>
      <Flex
        flexDirection="column"
        gap="$spacing40"
        maxWidth="$maxWidth1200"
        width="100%"
        p="$spacing24"
        pt="$none"
        position="relative"
        mb={mb}
        $sm={{ p: '$spacing8' }}
      >
        {showDemoView && <PortfolioConnectWalletBanner />}
        {showDemoView && <ConnectWalletFixedBottomButton />}
        {/* Animated Content Area - All routes show same content, filtered by chain */}
        <Flex gap="$spacing24">
          <PortfolioHeader enableScrollCompact={!showDemoView} />
          {showDemoView ? (
            <Flex cursor="not-allowed">
              <PortfolioContent disabled />
            </Flex>
          ) : (
            <PortfolioContent />
          )}
        </Flex>
      </Flex>
    </PortfolioOutageProvider>
  )
}
