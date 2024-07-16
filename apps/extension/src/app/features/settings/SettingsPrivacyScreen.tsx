import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { Flex } from 'ui/src'
import { AnalyticsToggleLineSwitch } from 'wallet/src/components/settings/AnalyticsToggleLineSwitch'

export function SettingsPrivacyScreen(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex>
      <ScreenHeader title={t('settings.setting.privacy.title')} />
      <AnalyticsToggleLineSwitch />
    </Flex>
  )
}
