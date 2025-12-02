import { PortfolioConnectWalletBanner } from 'pages/Portfolio/ConnectWalletBanner'
import { ConnectWalletFixedBottomButton } from 'pages/Portfolio/ConnectWalletFixedBottomButton'
import { PortfolioHeader } from 'pages/Portfolio/Header/Header'
import useIsConnected from 'pages/Portfolio/Header/hooks/useIsConnected'
import { PortfolioContent } from 'pages/Portfolio/PortfolioContent'
import { Flex } from 'ui/src'

interface PortfolioPageInnerProps {
  scrollY: number
  isBannerVisible: boolean
  mb?: number | string
}

export function PortfolioPageInner({ scrollY, isBannerVisible, mb }: PortfolioPageInnerProps): JSX.Element {
  const isConnected = useIsConnected()

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
      {!isConnected && <PortfolioConnectWalletBanner />}
      {!isConnected && <ConnectWalletFixedBottomButton shouldShow={!isBannerVisible} />}

      {isConnected ? (
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
