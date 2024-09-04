import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Flex, Switch, Text } from 'ui/src'
import { selectAllowAnalytics } from 'wallet/src/features/telemetry/selectors'
import { setAllowAnalytics } from 'wallet/src/features/telemetry/slice'

export function AnalyticsToggleLineSwitch(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const analyticsAllowed = useSelector(selectAllowAnalytics)

  const onChangeAllowAnalytics = (enabled: boolean): void => {
    dispatch(setAllowAnalytics({ enabled }))
  }

  return (
    <Flex row gap="$spacing12" m="$spacing24">
      <Flex shrink gap="$spacing4">
        <Text variant="body2">{t('settings.setting.privacy.analytics.title')}</Text>
        <Text color="$neutral2" variant="body3">
          {t('settings.setting.privacy.analytics.description')}
        </Text>
      </Flex>
      <Switch checked={analyticsAllowed} variant="branded" onCheckedChange={onChangeAllowAnalytics} />
    </Flex>
  )
}
