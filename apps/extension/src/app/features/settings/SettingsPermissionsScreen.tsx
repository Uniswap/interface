import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { DefaultWalletLineSwitch } from 'src/app/features/settings/DefaultWalletLineSwitch'
import { Flex } from 'ui/src'
import { AnalyticsToggleLineSwitch } from 'wallet/src/components/settings/AnalyticsToggleLineSwitch'

export function SettingsPermissionsScreen(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex>
      <ScreenHeader title={t('settings.setting.permissions.title')} />
      <AnalyticsToggleLineSwitch />
      <DefaultWalletLineSwitch />
    </Flex>
  )
}
