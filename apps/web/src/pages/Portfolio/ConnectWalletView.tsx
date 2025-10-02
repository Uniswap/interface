import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { LineChartDots } from 'ui/src/components/icons/LineChartDots'
import { iconSizes } from 'ui/src/theme'

export default function PortfolioConnectWalletView() {
  const { t } = useTranslation()
  const accountDrawer = useAccountDrawer()
  return (
    <Flex alignItems="center">
      <Flex
        p="$spacing40"
        borderWidth={1}
        borderColor="$surface3"
        borderRadius="$rounded32"
        width={480}
        maxWidth="100%"
        gap="$spacing24"
        alignItems="center"
        mt="$spacing40"
      >
        <Flex width="fit-content" backgroundColor="$accent2" borderRadius="$rounded12" p="$spacing8">
          <LineChartDots size={iconSizes.icon32} color="$accent1" />
        </Flex>
        <Flex gap="$spacing4" alignItems="center">
          <Text variant="body1">{t('common.getStarted')}</Text>
          <Text variant="body3" color="$neutral2">
            {t('portfolio.connectWallet.summary')}
          </Text>
        </Flex>
        <Button variant="branded" emphasis="primary" size="large" minHeight={48} onPress={accountDrawer.open}>
          {t('common.connectWallet.button')}
        </Button>
      </Flex>
    </Flex>
  )
}
