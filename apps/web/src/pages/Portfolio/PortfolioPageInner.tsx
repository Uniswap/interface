import { Flex } from '@universe/mycelium'
import { useRef } from 'react'
import { PortfolioTab } from '~/hooks/usePortfolioRoutes/types'
import { usePortfolioRoutes } from '~/hooks/usePortfolioRoutes/usePortfolioRoutes'
import { PortfolioConnectWalletBanner } from '~/pages/Portfolio/ConnectWalletBanner'
import { ConnectWalletFixedBottomButton } from '~/pages/Portfolio/ConnectWalletFixedBottomButton'
import { PortfolioHeader } from '~/pages/Portfolio/Header/Header'
import { usePortfolioHeartbeatCoordinator } from '~/pages/Portfolio/hooks/usePortfolioHeartbeatCoordinator'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'
import { useTableHeadsStickBelow } from '~/pages/Portfolio/hooks/useTableHeadsStickBelow'
import { PortfolioContent } from '~/pages/Portfolio/PortfolioContent'
import { PortfolioOutageProvider } from '~/pages/Portfolio/PortfolioOutageContext'

interface PortfolioPageInnerProps {
  mb?: number
}

export function PortfolioPageInner({ mb }: PortfolioPageInnerProps): JSX.Element {
  const showDemoView = useShowDemoView()
  const { tab } = usePortfolioRoutes()

  usePortfolioHeartbeatCoordinator({ tab })

  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  // Overview's mini tables are short previews; their heads keep scrolling with the page.
  useTableHeadsStickBelow({
    headerRef,
    containerRef: contentRef,
    enabled: tab !== PortfolioTab.Overview,
  })

  return (
    <PortfolioOutageProvider>
      <Flex
        flexDirection="column"
        gap="$spacing40"
        maxWidth={1200}
        width="100%"
        p="$spacing24"
        pt="$none"
        position="relative"
        mb={mb}
        $md={{ px: '$none' }}
        $sm={{ py: '$spacing8' }}
      >
        {showDemoView && <PortfolioConnectWalletBanner />}
        {showDemoView && <ConnectWalletFixedBottomButton />}
        {/* Animated Content Area - All routes show same content, filtered by chain */}
        <Flex ref={contentRef} gap="$spacing24">
          <PortfolioHeader ref={headerRef} enableScrollCompact={!showDemoView} />
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
