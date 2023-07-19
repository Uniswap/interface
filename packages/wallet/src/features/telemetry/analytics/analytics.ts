import { NotImplementedError } from 'wallet/src/utils/errors'

// matches amplitude supported values, not using amplitude's type to decouple from underlying library
export type UserPropertyValue = number | string | boolean | Array<string | number>

export interface Analytics {
  init(): Promise<void>
  sendEvent(eventName: string, eventProperties: Record<string, unknown>): void
  flushEvents(): void
  setUserProperty(property: string, value: UserPropertyValue): void
}

export const analytics: Analytics = {
  init(): Promise<void> {
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
