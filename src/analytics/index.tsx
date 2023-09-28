import {
  sendAnalyticsEvent as sendAnalyticsTraceEvent,
  Trace as AnalyticsTrace,
  TraceEvent as AnalyticsEvent,
} from '@uniswap/analytics'
import { atomWithStorage, useAtomValue } from 'jotai/utils'
import { memo } from 'react'

export {
  type ITraceContext,
  getDeviceId,
  initializeAnalytics,
  OriginApplication,
  user,
  useTrace,
} from '@uniswap/analytics'

const allowAnalyticsAtomKey = 'allow_analytics'
export const allowAnalyticsAtom = atomWithStorage<boolean>(allowAnalyticsAtomKey, true)

export const Trace = memo((props: React.ComponentProps<typeof AnalyticsTrace>) => {
  const allowAnalytics = useAtomValue(allowAnalyticsAtom)
  const shouldLogImpression = allowAnalytics ? props.shouldLogImpression : false

  return <AnalyticsTrace {...props} shouldLogImpression={shouldLogImpression} />
})

Trace.displayName = 'Trace'

export const TraceEvent = memo((props: React.ComponentProps<typeof AnalyticsEvent>) => {
  const allowAnalytics = useAtomValue(allowAnalyticsAtom)
  const shouldLogImpression = allowAnalytics ? props.shouldLogImpression : false

  return <AnalyticsEvent {...props} shouldLogImpression={shouldLogImpression} />
})

TraceEvent.displayName = 'TraceEvent'

export const sendAnalyticsEvent: typeof sendAnalyticsTraceEvent = (event, properties) => {
  let allowAnalytics = true

  try {
    const value = localStorage.getItem(allowAnalyticsAtomKey)

    if (typeof value === 'string') {
      allowAnalytics = JSON.parse(value)
    }
    // eslint-disable-next-line no-empty
  } catch {}

  if (allowAnalytics) {
    sendAnalyticsTraceEvent(event, properties)
  }
}

// This is only used for initial page load so we can get the user's country
export const sendInitializationEvent: typeof sendAnalyticsTraceEvent = (event, properties) => {
  sendAnalyticsTraceEvent(event, properties)
}
