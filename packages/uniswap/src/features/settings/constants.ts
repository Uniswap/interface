import { ONE_DAY_MS, ONE_HOUR_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'

export enum DeviceAccessTimeout {
  FiveMinutes = '5_MIN',
  ThirtyMinutes = '30_MIN',
  OneHour = '1_HR',
  TwentyFourHours = '24_HR',
  Never = 'NEVER',
}

export const DEFAULT_DEVICE_ACCESS_TIMEOUT: DeviceAccessTimeout = DeviceAccessTimeout.ThirtyMinutes

export const ORDERED_DEVICE_ACCESS_TIMEOUTS: DeviceAccessTimeout[] = [
  DeviceAccessTimeout.FiveMinutes,
  DeviceAccessTimeout.ThirtyMinutes,
  DeviceAccessTimeout.OneHour,
  DeviceAccessTimeout.TwentyFourHours,
  DeviceAccessTimeout.Never,
]

/**
 * Converts DeviceAccessTimeout enum to milliseconds for timeout calculations
 * @param timeout The DeviceAccessTimeout enum value
 * @returns The timeout in milliseconds, or undefined for 'Never'
 */
export function deviceAccessTimeoutToMs(timeout: DeviceAccessTimeout): number | undefined {
  switch (timeout) {
    case DeviceAccessTimeout.FiveMinutes:
      return 5 * ONE_MINUTE_MS
    case DeviceAccessTimeout.ThirtyMinutes:
      return 30 * ONE_MINUTE_MS
    case DeviceAccessTimeout.OneHour:
      return ONE_HOUR_MS
    case DeviceAccessTimeout.TwentyFourHours:
      return ONE_DAY_MS
    case DeviceAccessTimeout.Never:
      return undefined
    default:
      return 30 * ONE_MINUTE_MS // Default fallback to 30 minutes
  }
}
