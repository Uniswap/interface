import { sendAnalyticsEvent, Trace, TraceEvent } from '@uniswap/analytics'
import { analyticsOptOutAtomName, analyticsOptOutToggle } from 'components/AccountDrawer/AnalyticsToggle'
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

export const sendOptOutAnalyticsEvent: typeof sendAnalyticsEvent = (event, properties) => {
  const value = localStorage.getItem(analyticsOptOutAtomName)
  let canSendAnalytics = false

  if (typeof value === 'string' && JSON.parse(value) === true) {
    canSendAnalytics = true
  }

  if (canSendAnalytics) {
    sendAnalyticsEvent(event, properties)
  }
}
