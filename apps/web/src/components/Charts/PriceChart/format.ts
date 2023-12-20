import { NumberValue } from 'd3'
import { TimePeriod } from 'graphql/data/util'

const HOUR_OPTIONS = { hour: 'numeric', minute: 'numeric', hour12: true } as const // e.g. '12:00 PM'
const DAY_HOUR_OPTIONS = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true } as const // e.g. 'Jul 4, 12:00 PM'
const MONTH_DAY_OPTIONS = { month: 'long', day: 'numeric' } as const // e.g. 'July 4'
const MONTH_YEAR_DAY_OPTIONS = { month: 'short', year: 'numeric', day: 'numeric' } as const // e.g. 'Jul 4, 2021'
const MONTH_OPTIONS = { month: 'long' } as const // e.g. 'July'
const WEEK_OPTIONS = { weekday: 'long' } as const // e.g. 'Sunday'

// Timestamps are formatted differently based on their location/usage in charts
export enum TimestampFormatterType {
  TICK = 'tick',
  CROSSHAIR = 'crosshair',
}

const TIME_PERIOD_TO_FORMAT_OPTIONS: Record<TimePeriod, Record<TimestampFormatterType, Intl.DateTimeFormatOptions>> = {
  [TimePeriod.HOUR]: {
    [TimestampFormatterType.TICK]: HOUR_OPTIONS,
    [TimestampFormatterType.CROSSHAIR]: DAY_HOUR_OPTIONS,
  },
  [TimePeriod.DAY]: {
    [TimestampFormatterType.TICK]: HOUR_OPTIONS,
    [TimestampFormatterType.CROSSHAIR]: DAY_HOUR_OPTIONS,
  },
  [TimePeriod.WEEK]: {
    [TimestampFormatterType.TICK]: WEEK_OPTIONS,
    [TimestampFormatterType.CROSSHAIR]: DAY_HOUR_OPTIONS,
  },
  [TimePeriod.MONTH]: {
    [TimestampFormatterType.TICK]: MONTH_DAY_OPTIONS,
    [TimestampFormatterType.CROSSHAIR]: DAY_HOUR_OPTIONS,
  },
  [TimePeriod.YEAR]: {
    [TimestampFormatterType.TICK]: MONTH_OPTIONS,
    [TimestampFormatterType.CROSSHAIR]: MONTH_YEAR_DAY_OPTIONS,
  },
}

/**
 * Returns a function to format timestamps, specialized by timePeriod and type to display ('tick' or 'crosshair'),
 * localized for the given locale.
 */
export function getTimestampFormatter(
  timePeriod: TimePeriod,
  locale: string,
  formatterType: TimestampFormatterType
): (n: NumberValue) => string {
  // Choose appropriate formatting options based on type and timePeriod
  const options = TIME_PERIOD_TO_FORMAT_OPTIONS[timePeriod][formatterType]
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, options)

  return (timestamp: NumberValue): string => {
    const epochTimeInMilliseconds = timestamp.valueOf() * 1000
    return dateTimeFormatter.format(epochTimeInMilliseconds)
  }
}
