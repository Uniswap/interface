import gridDarkSvg from 'assets/images/portfolio-connect-wallet-banner-grid/dark.svg'
import gridLightSvg from 'assets/images/portfolio-connect-wallet-banner-grid/light.svg'
import { AnimatedEmblems } from 'pages/Portfolio/components/AnimatedStyledBanner/AnimatedEmblems'
import { CONNECT_WALLET_BANNER_HEIGHT } from 'pages/Portfolio/constants'
import { Flex, useIsDarkMode, useMedia } from 'ui/src'
import { zIndexes } from 'ui/src/theme'

export function AnimatedStyledBanner({ children }: { children: React.ReactNode | React.ReactNode[] }) {
  const isDarkMode = useIsDarkMode()
  const media = useMedia()
  const showEmblems = !media.md

  return (
    <Flex
      height={CONNECT_WALLET_BANNER_HEIGHT}
      backgroundColor="$accent2"
      borderRadius="$rounded24"
      overflow="hidden"
      mt="$spacing40"
      $platform-web={{
        backgroundImage: `url(${isDarkMode ? gridDarkSvg : gridLightSvg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {showEmblems && <AnimatedEmblems />}
      <Flex width="100%" height="100%" zIndex={zIndexes.default} centered gap="$spacing24">
        {children}
      </Flex>
    </Flex>
  )
}
