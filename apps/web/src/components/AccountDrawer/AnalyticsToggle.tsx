import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
// eslint-disable-next-line no-restricted-imports
import { analytics, getAnalyticsAtomDirect } from 'utilities/src/telemetry/analytics/analytics'

export function AnalyticsToggle() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [x, setCounter] = useState(0)
  const [allowAnalytics, setAllowAnalytics] = useState(true)
  const { t } = useTranslation()

  getAnalyticsAtomDirect(true).then((v: boolean) => setAllowAnalytics(v))

  return (
    <SettingsToggle
      title={t('analytics.allow')}
      description={t('analytics.allow.message')}
      isActive={allowAnalytics}
      toggle={() => {
        analytics.setAllowAnalytics(!allowAnalytics)
        setCounter((c) => c + 1)
      }}
    />
  )
}
