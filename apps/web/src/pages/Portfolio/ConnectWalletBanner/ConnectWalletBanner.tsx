import gridDarkSvg from 'assets/images/portfolio-connect-wallet-banner-grid/dark.svg'
import gridLightSvg from 'assets/images/portfolio-connect-wallet-banner-grid/light.svg'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { AnimatedEmblems } from 'pages/Portfolio/ConnectWalletBanner/AnimatedEmblems'
import { CONNECT_WALLET_BANNER_HEIGHT } from 'pages/Portfolio/constants'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useIsDarkMode, useMedia } from 'ui/src'
import { zIndexes } from 'ui/src/theme'

export function PortfolioConnectWalletBanner() {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const accountDrawer = useAccountDrawer()
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
        <Text variant="body2" color="$neutral1">
          {t('common.connectAWallet.button')}{' '}
          <Text variant="body2" color="$neutral2">
            {t('portfolio.disconnected.viewYourPortfolio.cta')}
          </Text>
        </Text>
        <Flex row centered>
          <Button variant="branded" emphasis="primary" size="medium" width={164} onPress={accountDrawer.open}>
            {t('common.button.connect')}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}
