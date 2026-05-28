import { PlatformSplitStubError } from 'utilities/src/errors'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'

// matches amplitude supported values, not using amplitude's type to decouple from underlying library
export type UserPropertyValue = number | string | boolean | Array<string | number>

export interface TestnetModeConfig {
  aggregateEventName: string
  passthroughAllowlistEvents: string[]
  allowlistEvents: string[]
}

export async function getAnalyticsAtomDirect(_forceRead?: boolean): Promise<boolean> {
  throw new PlatformSplitStubError('getAnalyticsAtomDirect')
}

export interface Analytics {
  init(
    transportProvider: ApplicationTransport,
    allowed: boolean,
    initHash?: string,
    userIdGetter?: () => Promise<string>,
  ): Promise<void>
  setAllowAnalytics(allowed: boolean): Promise<void>
  setTestnetMode(enabled: boolean, _config: TestnetModeConfig): void
  sendEvent(eventName: string, eventProperties: Record<string, unknown>): void
  flushEvents(): void
  setUserProperty(property: string, value: UserPropertyValue, insert?: boolean): void
}

export const analytics: Analytics = {
  init(
    _transportProvider: ApplicationTransport,
    _allowed: boolean,
    _initHash?: string,
    _userIdGetter?: () => Promise<string>,
  ): Promise<void> {
    throw new PlatformSplitStubError('initAnalytics')
  },
  setAllowAnalytics(_allowed: boolean): Promise<void> {
    throw new PlatformSplitStubError('flushAnalyticsEvents')
  },
  setTestnetMode(_enabled: boolean, _config: TestnetModeConfig): void {
    throw new PlatformSplitStubError('setTestnetMode')
  },
  sendEvent(_eventName: string, ..._eventProperties: unknown[]): void {
    throw new PlatformSplitStubError('sendAnalyticsEvent')
  },
  flushEvents(): void {
    throw new PlatformSplitStubError('flushAnalyticsEvents')
  },
  setUserProperty(_property: string, _value: UserPropertyValue): void {
    throw new PlatformSplitStubError('setUserProperty')
  },
}
