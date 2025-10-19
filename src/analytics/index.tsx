import {
  sendAnalyticsEvent as sendAnalyticsTraceEvent,
  Trace as AnalyticsTrace,
  TraceEvent as AnalyticsEvent,
} from '@uniswap/analytics'
import { useAtomValue } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
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

/**
 * Sanitizes properties to remove circular references and non-serializable values
 * that would cause "Converting circular structure to JSON" errors in Amplitude's debug logging.
 */
function sanitizeEventProperties(properties: Record<string, any> | undefined): Record<string, any> | undefined {
  if (!properties) return properties

  const seen = new WeakSet()

  function sanitize(obj: any, depth = 0): any {
    // Prevent infinite recursion
    if (depth > 10) return '[Max Depth Reached]'

    // Handle null and primitives
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    // Check for circular references
    if (seen.has(obj)) {
      return '[Circular Reference]'
    }
    seen.add(obj)

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => sanitize(item, depth + 1))
    }

    // Handle React elements and other non-serializable objects
    if (obj.$$typeof || obj._reactInternals || obj instanceof Element) {
      return '[Non-Serializable Object]'
    }

    // Handle regular objects
    const sanitized: Record<string, any> = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        try {
          sanitized[key] = sanitize(obj[key], depth + 1)
        } catch (error) {
          sanitized[key] = '[Error Serializing]'
        }
      }
    }

    return sanitized
  }

  return sanitize(properties)
}

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
    // Sanitize properties to prevent circular JSON errors in Amplitude's debug logging
    const sanitizedProperties = sanitizeEventProperties(properties)
    sendAnalyticsTraceEvent(event, sanitizedProperties)
  }
}
