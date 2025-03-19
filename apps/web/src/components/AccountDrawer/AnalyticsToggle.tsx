import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { analytics, getAnalyticsAtomDirect } from 'utilities/src/telemetry/analytics/analytics'

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
      title={t('analytics.allow')}
      description={t('analytics.allow.message')}
      isActive={allowAnalytics}
      toggle={handleToggle}
    />
  )
}
