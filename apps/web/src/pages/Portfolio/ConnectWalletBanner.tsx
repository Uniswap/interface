import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { AnimatedStyledBanner } from 'pages/Portfolio/components/AnimatedStyledBanner/AnimatedStyledBanner'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'

export function PortfolioConnectWalletBanner() {
  const { t } = useTranslation()
  const accountDrawer = useAccountDrawer()

  return (
    <AnimatedStyledBanner>
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
    </AnimatedStyledBanner>
  )
}
