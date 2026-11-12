import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { SegmentedControlOption } from '@universe/mycelium/segmented-control-compat'
import { TFunction } from 'i18next'
import { chartPeriodToLabel } from 'uniswap/src/features/portfolio/chartPeriod'
import { TimePeriod } from '~/data/util'

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

export function getDayBasedTimePeriodLabel(t: TFunction, period: TimePeriod): string {
  if (period === TimePeriod.WEEK) {
    return t('common.sevenDays.short')
  }
  if (period === TimePeriod.MONTH) {
    return t('common.thirtyDays.short')
  }
  return getTimePeriodLabel(t, period)
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

export const LIVE_POOL_VOLUME_PERIODS = [TimePeriod.DAY, TimePeriod.MONTH] as const

export type LivePoolVolumePeriod = (typeof LIVE_POOL_VOLUME_PERIODS)[number]

export function getPillTimeSelectorOptions(
  t: TFunction,
  periods: readonly TimePeriod[] = ORDERED_TIMES,
): SegmentedControlOption<TimePeriod>[] {
  return periods.map((period) => ({
    value: period,
    displayText: chartPeriodToLabel(t, timePeriodToChartPeriod(period)),
  }))
}

function timePeriodToChartPeriod(period: TimePeriod): ChartPeriod {
  switch (period) {
    case TimePeriod.HOUR:
      return ChartPeriod.HOUR
    case TimePeriod.DAY:
      return ChartPeriod.DAY
    case TimePeriod.WEEK:
      return ChartPeriod.WEEK
    case TimePeriod.MONTH:
      return ChartPeriod.MONTH
    case TimePeriod.YEAR:
      return ChartPeriod.YEAR
    case TimePeriod.MAX:
      return ChartPeriod.MAX
    default:
      return ChartPeriod.DAY
  }
}
