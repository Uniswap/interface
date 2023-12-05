import { logger } from 'utilities/src/logger/logger'
import { UserPropertyValue } from './analytics'

interface ErrorLoggers {
  init(err: unknown): void
  sendEvent(eventName: string, eventProperties?: Record<string, unknown>): void
  flushEvents(): void
  setUserProperty(property: string, value: UserPropertyValue): void
}

export function generateErrorLoggers(fileName: string): ErrorLoggers {
  return {
    init(error: unknown): void {
      logger.error(error, { tags: { file: fileName, function: 'init' } })
    },
    sendEvent(eventName: string, eventProperties?: Record<string, unknown>): void {
      if (__DEV__) {
        logger.info(
          'analytics',
          'sendEvent',
          `[analytics(${eventName})]: ${JSON.stringify(eventProperties ?? {})}`
        )
      }
    },
    flushEvents(): void {
      if (__DEV__) {
        logger.info('analytics', 'flushEvents', 'flushing analytics events')
      }
    },
    setUserProperty(property: string, value: UserPropertyValue): void {
      if (__DEV__) {
        logger.info('analytics', 'setUserProperty', `property: ${property}, value: ${value}`)
      }
    },
  }
}
