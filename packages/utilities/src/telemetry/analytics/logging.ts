import { isNonJestDev } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { UserPropertyValue } from 'utilities/src/telemetry/analytics/analytics'

interface ErrorLoggers {
  init(err: unknown): void
  setAllowAnalytics(allow: boolean): void
  sendEvent(eventName: string, eventProperties?: Record<string, unknown>): void
  flushEvents(): void
  setUserProperty(property: string, value: UserPropertyValue): void
}

export function generateAnalyticsLoggers(fileName: string): ErrorLoggers {
  return {
    init(error: unknown): void {
      logger.error(error, { tags: { file: fileName, function: 'init' } })
    },
    sendEvent(eventName: string, eventProperties?: Record<string, unknown>): void {
      if (isNonJestDev) {
        logger.info('analytics', 'sendEvent', `[Event: ${eventName}]`, eventProperties ?? {})
      }
    },
    setAllowAnalytics(allow: boolean): void {
      if (isNonJestDev) {
        logger.info('analytics', 'setAnonymous', `user allows analytics: ${allow}`)
      }
    },
    flushEvents(): void {
      if (isNonJestDev) {
        logger.info('analytics', 'flushEvents', 'flushing analytics events')
      }
    },
    setUserProperty(property: string, value: UserPropertyValue): void {
      if (isNonJestDev) {
        logger.info('analytics', 'setUserProperty', `[Property: ${property}]: ${value}`)
      }
    },
  }
}
