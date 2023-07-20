import {
  sendAnalyticsEvent as sendAnalyticsTraceEvent,
  Trace as AnalyticsTrace,
  TraceEvent as AnalyticsEvent,
} from '@uniswap/analytics'
import { atomWithStorage, useAtomValue } from 'jotai/utils'
import { memo } from 'react'

const analyticsOptOutAtomName = 'optOutOfAnalytics'
export const analyticsOptOutToggle = atomWithStorage<boolean>(analyticsOptOutAtomName, true)

export const Trace = memo((props: React.ComponentProps<typeof AnalyticsTrace>) => {
  const allowAnalytics = useAtomValue(analyticsOptOutToggle)

  return <AnalyticsTrace {...props} shouldLogImpression={allowAnalytics} />
})

Trace.displayName = 'Trace'

export const TraceEvent = memo((props: React.ComponentProps<typeof AnalyticsEvent>) => {
  const allowAnalytics = useAtomValue(analyticsOptOutToggle)

  return <AnalyticsEvent {...props} shouldLogImpression={allowAnalytics} />
})

TraceEvent.displayName = 'TraceEvent'

export const sendAnalyticsEvent: typeof sendAnalyticsTraceEvent = (event, properties) => {
  const value = localStorage.getItem(analyticsOptOutAtomName)
  let canSendAnalytics = true

  if (typeof value === 'string' && JSON.parse(value) === false) {
    canSendAnalytics = false
  }

  if (canSendAnalytics) {
    sendAnalyticsTraceEvent(event, properties)
  }
}

export { getDeviceId, initializeAnalytics, OriginApplication, user, useTrace } from '@uniswap/analytics'
