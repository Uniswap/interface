import { t } from '@lingui/macro'
import { allowAnalyticsAtom } from 'analytics'
import { useAtom } from 'jotai'

import { SettingsToggle } from './SettingsToggle'

export function AnalyticsToggle() {
  const [allowAnalytics, updateAllowAnalytics] = useAtom(allowAnalyticsAtom)

  return (
    <SettingsToggle
      title={t`Allow analytics`}
      description={t`We use anonymized data to enhance your experience with Uniswap Labs products.`}
      isActive={allowAnalytics}
      toggle={() => void updateAllowAnalytics((value) => !value)}
    />
  )
}
