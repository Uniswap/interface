import { useTranslation } from 'react-i18next'
import { Wallet } from 'ui/src/components/icons/Wallet'
import { Flex, Text } from 'ui/src/index'

export function NoSolanaWalletConnectedView() {
  const { t } = useTranslation()

  return (
    <Flex padding="$spacing20" centered>
      <Wallet size="$icon.32" color="$neutral2" margin="$padding8" />
      <Flex gap="$gap4" centered marginVertical="$spacing8">
        <Text variant="subheading2" color="$neutral2" textAlign="center" paddingVertical="$spacing6">
          {t('wallet.connecting.solanaPrompt.noWalletDetected.header')}
        </Text>
        <Text variant="body3" color="$neutral2" textAlign="center">
          {t('wallet.connecting.solanaPrompt.noWalletDetected.description')}
        </Text>
      </Flex>
    </Flex>
  )
}
