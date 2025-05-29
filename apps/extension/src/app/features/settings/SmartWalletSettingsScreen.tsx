import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { Flex } from 'ui/src'
import {
  SmartWalletHelpIcon,
  SmartWalletSettingsContent,
} from 'wallet/src/features/smartWallet/SmartWalletSettingsContent'

export function SmartWalletSettingsScreen(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex fill gap="$gap16">
      <ScreenHeader
        title={t('settings.setting.smartWallet.action.smartWallet')}
        rightColumn={<SmartWalletHelpIcon />}
      />

      <SmartWalletSettingsContent />
    </Flex>
  )
}
