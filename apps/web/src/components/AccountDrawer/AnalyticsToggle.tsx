import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { LineChartDots } from 'ui/src/components/icons/LineChartDots'
import { Flex, Text, Tooltip } from 'ui/src/index'
// oxlint-disable-next-line no-restricted-imports -- Direct analytics import needed for toggling analytics settings
import { analytics, getAnalyticsAtomDirect } from 'utilities/src/telemetry/analytics/analytics'
import { SettingsToggle } from '~/components/AccountDrawer/SettingsToggle'

export function AnalyticsToggle() {
  const [allowAnalytics, setAllowAnalytics] = useState<boolean | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    getAnalyticsAtomDirect(true)
      .then((enabled) => setAllowAnalytics(enabled))
      .catch(() => {
        setAllowAnalytics(true)
      })
  }, [])

  const handleToggle = useCallback(async () => {
    await analytics.setAllowAnalytics(!allowAnalytics)
    setAllowAnalytics(!allowAnalytics)
  }, [allowAnalytics])

  if (allowAnalytics === null) {
    return null
  }

  return (
    <SettingsToggle
      icon={<LineChartDots size="$icon.24" color="$neutral2" />}
      title={
        <Flex row gap="$gap8" alignItems="center">
          <Text variant="subheading2" color="$neutral1">
            {t('analytics.allow')}
          </Text>
          <Tooltip placement="top-end">
            <Tooltip.Trigger>
              <InfoCircle size="$icon.16" color="$neutral3" />
            </Tooltip.Trigger>
            <Tooltip.Content maxWidth="290px">
              <Text variant="body3" color="$neutral2">
                {t('analytics.allow.message')}
              </Text>
            </Tooltip.Content>
          </Tooltip>
        </Flex>
      }
      isActive={allowAnalytics}
      toggle={handleToggle}
    />
  )
}
