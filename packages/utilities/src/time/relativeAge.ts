// Local constants rather than utilities/src/time/time, which pulls in dayjs: apps import this module for one function.
const SECOND_MS = 1_000
const MINUTE_MS = 60 * SECOND_MS
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const DAYS_IN_MONTH = 30
const MONTHS_IN_YEAR = 12

export type RelativeAgeUnit = 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years'

export interface RelativeAge {
  unit: RelativeAgeUnit
  value: number
}

/**
 * The time elapsed from `atMs` to `nowMs` in ONE floored unit, for "32m" / "3d" / "2y" age labels:
 * a unit only advances once fully elapsed (89 minutes is 1 hour until 120). The ladder runs
 * s → m → h → d → mo → y with no weeks, so 29 days steps straight to 1 month; a month is 30 days
 * and a year is twelve of those, so the same age reads the same in every app.
 *
 * A future `atMs` (clock skew, a not-yet-open window) clamps to 0 seconds — never a negative age.
 * Returns undefined when either input isn't a finite number.
 */
export function getRelativeAge(atMs: number, nowMs: number): RelativeAge | undefined {
  const elapsedMs = nowMs - atMs
  if (!Number.isFinite(elapsedMs)) {
    return undefined
  }
  const seconds = Math.floor(Math.max(0, elapsedMs) / SECOND_MS)
  if (seconds < 60) {
    return { unit: 'seconds', value: seconds }
  }
  const minutes = Math.floor(elapsedMs / MINUTE_MS)
  if (minutes < 60) {
    return { unit: 'minutes', value: minutes }
  }
  const hours = Math.floor(elapsedMs / HOUR_MS)
  if (hours < 24) {
    return { unit: 'hours', value: hours }
  }
  const days = Math.floor(elapsedMs / DAY_MS)
  const months = Math.floor(days / DAYS_IN_MONTH)
  if (months < 1) {
    return { unit: 'days', value: days }
  }
  const years = Math.floor(months / MONTHS_IN_YEAR)
  if (years < 1) {
    return { unit: 'months', value: months }
  }
  return { unit: 'years', value: years }
}
