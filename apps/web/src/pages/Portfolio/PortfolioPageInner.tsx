import { Flex } from 'ui/src'
import { PortfolioConnectWalletBanner } from '~/pages/Portfolio/ConnectWalletBanner'
import { ConnectWalletFixedBottomButton } from '~/pages/Portfolio/ConnectWalletFixedBottomButton'
import { PortfolioHeader } from '~/pages/Portfolio/Header/Header'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'
import { PortfolioContent } from '~/pages/Portfolio/PortfolioContent'

interface PortfolioPageInnerProps {
  scrollY: number
  isBannerVisible: boolean
  mb?: number | string
}

export function PortfolioPageInner({ scrollY, isBannerVisible, mb }: PortfolioPageInnerProps): JSX.Element {
  const showDemoView = useShowDemoView()

  return (
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
      {showDemoView && <ConnectWalletFixedBottomButton shouldShow={!isBannerVisible} />}

      {!showDemoView ? (
        <>
          <PortfolioHeader scrollY={scrollY} />

          {/* Animated Content Area - All routes show same content, filtered by chain */}
          <PortfolioContent />
        </>
      ) : (
        <>
          <PortfolioHeader />

          {/* Animated Content Area - All routes show same content, filtered by chain */}
          <Flex cursor="not-allowed">
            <PortfolioContent disabled />
          </Flex>
        </>
      )}
    </Flex>
  )
}
