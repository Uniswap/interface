import { msg } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { allowAnalyticsAtom } from 'analytics'
import { useAtom } from 'jotai'

import { SettingsToggle } from './SettingsToggle'

export function AnalyticsToggle() {
  const { _ } = useLingui()
  const [allowAnalytics, updateAllowAnalytics] = useAtom(allowAnalyticsAtom)

  return (
    <SettingsToggle
      title={_(msg`Allow analytics`)}
      description={_(msg`We use anonymized data to enhance your experience with Uniswap Labs products.`)}
      isActive={allowAnalytics}
      toggle={() => void updateAllowAnalytics((value) => !value)}
    />
  )
}
