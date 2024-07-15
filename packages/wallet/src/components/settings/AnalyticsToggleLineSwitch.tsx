import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, Text, isWeb } from 'ui/src'
import { Switch, WebSwitch } from 'wallet/src/components/buttons/Switch'
import { selectAllowAnalytics } from 'wallet/src/features/telemetry/selectors'
import { setAllowAnalytics } from 'wallet/src/features/telemetry/slice'
import { useAppSelector } from 'wallet/src/state'

export function AnalyticsToggleLineSwitch(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const analyticsAllowed = useAppSelector(selectAllowAnalytics)

  const onChangeAllowAnalytics = (enabled: boolean): void => {
    dispatch(setAllowAnalytics({ enabled }))
  }

  const SwitchComponent = isWeb ? WebSwitch : Switch

  return (
    <Flex row gap="$spacing12" m="$spacing24">
      <Flex shrink gap="$spacing4">
        <Text variant="body2">{t('settings.setting.privacy.analytics.title')}</Text>
        <Text color="$neutral2" variant="body3">
          {t('settings.setting.privacy.analytics.description')}
        </Text>
      </Flex>
      <SwitchComponent value={analyticsAllowed} onValueChange={onChangeAllowAnalytics} />
    </Flex>
  )
}
