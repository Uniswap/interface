import { Trace, TraceEvent } from '@uniswap/analytics'
import { analyticsOptOutToggle } from 'components/AccountDrawer/AnalyticsToggle'
import { useAtomValue } from 'jotai/utils'
import { memo } from 'react'

export const TraceAnalytics = memo((props: React.ComponentProps<typeof Trace>) => {
  const allowAnalytics = useAtomValue(analyticsOptOutToggle)

  return <Trace {...props} shouldLogImpression={allowAnalytics} />
})

TraceAnalytics.displayName = 'TraceAnalytics'

export const TraceAnalyticsEvent = memo((props: React.ComponentProps<typeof TraceEvent>) => {
  const allowAnalytics = useAtomValue(analyticsOptOutToggle)

  return <TraceEvent {...props} shouldLogImpression={allowAnalytics} />
})

TraceAnalyticsEvent.displayName = 'TraceAnalyticsEvent'
