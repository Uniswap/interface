import { t } from '@lingui/macro'
import { analyticsOptOutToggle } from 'components/analytics/TraceAnalytics'
import { useAtom } from 'jotai'

import { SettingsToggle } from './SettingsToggle'

export function AnalyticsToggle() {
  const [allowAnalytics, updateAllowAnalytics] = useAtom(analyticsOptOutToggle)

  return (
    <SettingsToggle
      title={t`Allow analytics`}
      description={t`We use anonymized data to enhance your experience with Uniswap Labs products.`}
      isActive={allowAnalytics}
      toggle={() => void updateAllowAnalytics((value) => !value)}
    />
  )
}
