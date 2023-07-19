import { t } from '@lingui/macro'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { SettingsToggle } from './SettingsToggle'

// eslint-disable-next-line import/no-unused-modules
export const analyticsOptOutToggle = atomWithStorage<boolean>('optOutOfAnalytics', true)

export function AnalyticsToggle() {
  const [allowAnalytics, updateAllowAnalytics] = useAtom(analyticsOptOutToggle)

  return (
    <SettingsToggle
      title={t`Allow analytics`}
      description={t`We use anonymized data to enhance your experience with Uniswap Labs products.`}
      isActive={allowAnalytics}
      toggle={() => {
        updateAllowAnalytics(!allowAnalytics)
      }}
    />
  )
}
