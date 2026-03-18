import { TFunction } from 'i18next'
import { SegmentedControlOption } from 'ui/src'
import { TimePeriod } from '~/appGraphql/data/util'

export function getTimePeriodLabel(t: TFunction, period: TimePeriod): string {
  switch (period) {
    case TimePeriod.HOUR:
      return t('token.priceExplorer.timeRangeLabel.hour')
    case TimePeriod.DAY:
      return t('token.priceExplorer.timeRangeLabel.day')
    case TimePeriod.WEEK:
      return t('token.priceExplorer.timeRangeLabel.week')
    case TimePeriod.MONTH:
      return t('token.priceExplorer.timeRangeLabel.month')
    case TimePeriod.YEAR:
      return t('token.priceExplorer.timeRangeLabel.year')
    case TimePeriod.MAX:
      return t('token.priceExplorer.timeRangeLabel.all')
    default:
      return period satisfies never
  }
}

export enum TimePeriodDisplay {
  HOUR = '1H',
  DAY = '1D',
  WEEK = '1W',
  MONTH = '1M',
  YEAR = '1Y',
  MAX = 'ALL',
}

export const DISPLAYS: Record<TimePeriod, TimePeriodDisplay> = {
  [TimePeriod.HOUR]: TimePeriodDisplay.HOUR,
  [TimePeriod.DAY]: TimePeriodDisplay.DAY,
  [TimePeriod.WEEK]: TimePeriodDisplay.WEEK,
  [TimePeriod.MONTH]: TimePeriodDisplay.MONTH,
  [TimePeriod.YEAR]: TimePeriodDisplay.YEAR,
  [TimePeriod.MAX]: TimePeriodDisplay.MAX,
}

export const ORDERED_TIMES: TimePeriod[] = [
  TimePeriod.HOUR,
  TimePeriod.DAY,
  TimePeriod.WEEK,
  TimePeriod.MONTH,
  TimePeriod.YEAR,
  TimePeriod.MAX,
]

export const SOLANA_ORDERED_TIMES: TimePeriod[] = [TimePeriod.HOUR, TimePeriod.DAY]

// eslint-disable-next-line consistent-return
export function getTimePeriodFromDisplay(display: TimePeriodDisplay): TimePeriod {
  switch (display) {
    case TimePeriodDisplay.HOUR:
      return TimePeriod.HOUR
    case TimePeriodDisplay.DAY:
      return TimePeriod.DAY
    case TimePeriodDisplay.WEEK:
      return TimePeriod.WEEK
    case TimePeriodDisplay.MONTH:
      return TimePeriod.MONTH
    case TimePeriodDisplay.YEAR:
      return TimePeriod.YEAR
    case TimePeriodDisplay.MAX:
      return TimePeriod.MAX
  }
}

export const DEFAULT_PILL_TIME_SELECTOR_OPTIONS = ORDERED_TIMES.map((time: TimePeriod) => ({
  value: DISPLAYS[time],
})) as SegmentedControlOption[]

export const EXPLORE_CHART_HEIGHT_PX = 356
