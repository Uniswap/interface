import { useTranslation } from 'react-i18next'
import { ScreenWithHeader } from 'src/components/layout/screens/ScreenWithHeader'
import { Flex, Text } from 'ui/src'
import {
  SmartWalletHelpIcon,
  SmartWalletSettingsContent,
} from 'wallet/src/features/smartWallet/SmartWalletSettingsContent'

export function SettingsSmartWalletScreen(): JSX.Element {
  const { t } = useTranslation()

  return (
    <ScreenWithHeader
      centerElement={<Text variant="subheading1">{t('settings.setting.smartWallet.action.smartWallet')}</Text>}
      rightElement={<SmartWalletHelpIcon />}
    >
      <Flex fill px="$padding12" py="$padding16" gap="$gap16">
        <SmartWalletSettingsContent />
      </Flex>
    </ScreenWithHeader>
  )
}
