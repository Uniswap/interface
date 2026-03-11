import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { WalletFilled } from 'ui/src/components/icons/WalletFilled'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'

export function NoWalletSection({ subtitle, alertDescription }: { subtitle: string; alertDescription: string }) {
  const { t } = useTranslation()
  const { open: openAccountDrawer } = useAccountDrawer()

  return (
    <Flex gap="$spacing24">
      <Flex gap="$spacing4">
        <Text variant="subheading1">{t('toucan.createAuction.step.tokenInfo.title')}</Text>
        <Text variant="body3" color="$neutral2">
          {subtitle}
        </Text>
      </Flex>
      <Flex
        row
        alignItems="center"
        gap="$spacing12"
        p="$spacing12"
        backgroundColor="$surface2"
        borderRadius="$rounded12"
      >
        <Flex
          borderRadius="$rounded12"
          backgroundColor="$surface3"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          p="$spacing12"
        >
          <WalletFilled color="$neutral1" size="$icon.20" />
        </Flex>
        <Flex flex={1} gap="$spacing2">
          <Text variant="body3" color="$neutral1">
            {t('toucan.createAuction.step.tokenInfo.noWallet')}
          </Text>
          <Text variant="body3" color="$neutral2">
            {alertDescription}
          </Text>
        </Flex>
      </Flex>
      <Flex row>
        <Button size="large" emphasis="secondary" onPress={openAccountDrawer} fill>
          {t('common.connectWallet.button')}
        </Button>
      </Flex>
    </Flex>
  )
}
