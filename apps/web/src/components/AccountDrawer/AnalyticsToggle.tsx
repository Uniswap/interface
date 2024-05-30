import { t } from 'i18n'
import { useState } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { analytics, getAnalyticsAtomDirect } from 'utilities/src/telemetry/analytics/analytics'
import { SettingsToggle } from './SettingsToggle'

export function AnalyticsToggle() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [x, setCounter] = useState(0)
  const [allowAnalytics, setAllowAnalytics] = useState(true)

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
