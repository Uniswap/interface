import { HOURS_IN_DAY, MINUTES_IN_HOUR } from 'utilities/src/time/time'

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
 * Converts DeviceAccessTimeout enum to minutes for timeout calculations
 * @param timeout The DeviceAccessTimeout enum value
 * @returns The timeout in minutes, or undefined for 'Never'
 */
export function deviceAccessTimeoutToMinutes(timeout: DeviceAccessTimeout): number | undefined {
  switch (timeout) {
    case DeviceAccessTimeout.FiveMinutes:
      return 5
    case DeviceAccessTimeout.ThirtyMinutes:
      return 30
    case DeviceAccessTimeout.OneHour:
      return MINUTES_IN_HOUR
    case DeviceAccessTimeout.TwentyFourHours:
      return HOURS_IN_DAY * MINUTES_IN_HOUR
    case DeviceAccessTimeout.Never:
      return undefined
    default:
      return 30 // Default fallback to 30 minutes
  }
}
