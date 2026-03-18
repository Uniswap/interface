import { isNonTestDev } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'
// biome-ignore lint/style/noRestrictedImports: Platform-specific implementation needs internal types
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
      if (isNonTestDev) {
        logger.info('analytics', 'sendEvent', `[Event: ${eventName}]`, eventProperties ?? {})
      }
    },
    setAllowAnalytics(allow: boolean): void {
      if (isNonTestDev) {
        logger.info('analytics', 'setAnonymous', `user allows analytics: ${allow}`)
      }
    },
    flushEvents(): void {
      if (isNonTestDev) {
        logger.info('analytics', 'flushEvents', 'flushing analytics events')
      }
    },
    setUserProperty(property: string, value: UserPropertyValue): void {
      if (isNonTestDev) {
        logger.info('analytics', 'setUserProperty', `[Property: ${property}]: ${value}`)
      }
    },
  }
}
