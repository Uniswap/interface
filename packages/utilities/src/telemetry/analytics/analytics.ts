import { NotImplementedError } from 'utilities/src/errors'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'

// matches amplitude supported values, not using amplitude's type to decouple from underlying library
export type UserPropertyValue = number | string | boolean | Array<string | number>

export interface Analytics {
  init(transportProvider: ApplicationTransport): Promise<void>
  sendEvent(eventName: string, eventProperties: Record<string, unknown>): void
  flushEvents(): void
  setUserProperty(property: string, value: UserPropertyValue): void
}

export const analytics: Analytics = {
  init(_transportProvider: ApplicationTransport): Promise<void> {
    throw new NotImplementedError('initAnalytics')
  },
  sendEvent(_eventName: string, ..._eventProperties: unknown[]): void {
    throw new NotImplementedError('sendAnalyticsEvent')
  },
  flushEvents(): void {
    throw new NotImplementedError('flushAnalyticsEvents')
  },
  setUserProperty(_property: string, _value: UserPropertyValue): void {
    throw new NotImplementedError('setUserProperty')
  },
}
