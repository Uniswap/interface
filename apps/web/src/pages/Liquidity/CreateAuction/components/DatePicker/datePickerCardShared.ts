import { HEX_RGB_PATTERN } from '~/pages/Liquidity/CreateAuction/tokenAccentHex'

export const pad = (n: number): string => String(n).padStart(2, '0')

/** Month / day / year token order for numeric date segments (from `Intl`, not translated month names). */
export type DateFieldKey = 'month' | 'day' | 'year'

const DEFAULT_DATE_FIELD_ORDER: readonly [DateFieldKey, DateFieldKey, DateFieldKey] = ['month', 'day', 'year']

/**
 * Order of month, day, and year in a short numeric date for the given locale (e.g. MDY vs DMY vs YMD).
 * Uses a reference calendar date where month and day differ so ambiguous patterns resolve correctly.
 */
export function getLocaleDateFieldOrder(intlLocale: string): readonly [DateFieldKey, DateFieldKey, DateFieldKey] {
  const ref = new Date(2003, 2, 4) // local Mar 4, 2003 — month 3, day 4
  const parts = new Intl.DateTimeFormat(intlLocale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(ref)
  const keys: DateFieldKey[] = []
  for (const { type } of parts) {
    if (type === 'month' || type === 'day' || type === 'year') {
      keys.push(type)
    }
  }
  if (keys.length !== 3) {
    return DEFAULT_DATE_FIELD_ORDER
  }
  return [keys[0]!, keys[1]!, keys[2]!]
}

/** Converts a Date to the string format expected by an <input type="date"> or <input type="datetime-local">. */
export function toInputValue(date: Date | undefined, inputType: 'date' | 'datetime-local'): string {
  if (!date) {
    return ''
  }
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  if (inputType === 'date') {
    return datePart
  }
  return `${datePart}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Parses the string value from an <input type="date"> or <input type="datetime-local">.
 *
 * For type="date", the value is "YYYY-MM-DD". new Date("YYYY-MM-DD") parses as UTC midnight,
 * which shifts the date in non-UTC timezones. We instead construct a local midnight Date to
 * ensure the selected calendar day is preserved regardless of the user's timezone.
 */
export function parsePickerValue(value: string, inputType: 'date' | 'datetime-local'): Date {
  if (inputType === 'date') {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year!, month! - 1, day!)
  }
  return new Date(value)
}

export type DatePickerCardBaseProps = {
  label: string
  date: Date | undefined
  minDate?: Date
  placeholder: string
  onDateChange: (date: Date | undefined) => void
  ariaLabel: string
  /** Controls picker granularity. Use "date" for day-level values, "datetime-local" for exact timestamps. Defaults to "datetime-local". */
  type?: 'date' | 'datetime-local'
  /**
   * When true, the closed card stays date-only (segmented MM/DD/YYYY) but the calendar modal
   * also renders a time row (hour, minute, optional AM/PM, UTC offset). The committed Date
   * combines the picked day with the time-row values.
   */
  showTimeInModal?: boolean
}

/** True when the locale renders clock hours in 12-hour form with AM/PM (e.g. en-US), false for 24-hour locales (e.g. de-DE). */
export function getLocaleUses12HourTime(intlLocale: string): boolean {
  return new Intl.DateTimeFormat(intlLocale, { hour: 'numeric' }).resolvedOptions().hour12 ?? false
}

/**
 * Formats the local UTC offset as "UTC±HH:MM" using the U+2212 minus sign (per Figma).
 * `Date#getTimezoneOffset()` returns minutes WEST of UTC (so e.g. EDT returns +240).
 */
export function formatUtcOffset(date: Date = new Date()): string {
  const totalMinutes = -date.getTimezoneOffset()
  const sign = totalMinutes < 0 ? '−' : '+'
  const abs = Math.abs(totalMinutes)
  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

/** Splits a Date into the strings rendered by the time-row inputs, in the requested clock format. */
export function splitTimeForDisplay(
  date: Date,
  uses12Hour: boolean,
): { hour: string; minute: string; period: 'AM' | 'PM' | null } {
  const hour24 = date.getHours()
  const minute = date.getMinutes()
  if (!uses12Hour) {
    return { hour: pad(hour24), minute: pad(minute), period: null }
  }
  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return { hour: String(hour12), minute: pad(minute), period }
}

/** Combines a calendar day with hour/minute, constructed in the user's local timezone (mirrors `parsePickerValue`'s local-midnight pattern). */
export function combineDateAndTime({ day, hour24, minute }: { day: Date; hour24: number; minute: number }): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour24, minute, 0, 0)
}

/** Converts a 12-hour clock value + period to a 24-hour hour. `hour12` must be 1-12. */
export function to24Hour({ hour12, period }: { hour12: number; period: 'AM' | 'PM' }): number {
  if (period === 'AM') {
    return hour12 % 12
  }
  return (hour12 % 12) + 12
}

/** Locale-aware compact time string (e.g. "12:00 AM" for en-US, "00:00" for de-DE). */
export function formatTimeForDisplay({ date, locale }: { date: Date; locale: string }): string {
  const uses12Hour = getLocaleUses12HourTime(locale)
  const { hour, minute, period } = splitTimeForDisplay(date, uses12Hour)
  return period ? `${hour}:${minute} ${period}` : `${hour}:${minute}`
}

/** Returns `rgba(...)` for a `#RRGGBB` string at the given alpha (0..1), or `undefined` for unsupported inputs. */
export function hexToRgba({ hex, alpha }: { hex: string; alpha: number }): string | undefined {
  if (!HEX_RGB_PATTERN.test(hex)) {
    return undefined
  }
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Returns a hex string darkened by `amount` (0..1). For example `0.12` ≈ 12% closer to black. */
export function darkenHex({ hex, amount }: { hex: string; amount: number }): string | undefined {
  if (!HEX_RGB_PATTERN.test(hex)) {
    return undefined
  }
  const factor = 1 - Math.min(Math.max(amount, 0), 1)
  const channel = (slice: string): string => {
    const next = Math.round(Number.parseInt(slice, 16) * factor)
    return next.toString(16).padStart(2, '0')
  }
  return `#${channel(hex.slice(1, 3))}${channel(hex.slice(3, 5))}${channel(hex.slice(5, 7))}`
}
