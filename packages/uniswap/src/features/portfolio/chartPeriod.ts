import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { TFunction } from 'i18next'
import { ElementName } from 'uniswap/src/features/telemetry/constants'

export const CHART_PERIOD_OPTIONS: ChartPeriod[] = [
  ChartPeriod.HOUR,
  ChartPeriod.DAY,
  ChartPeriod.WEEK,
  ChartPeriod.MONTH,
  ChartPeriod.YEAR,
  ChartPeriod.MAX,
]

export function chartPeriodToElementName(period: ChartPeriod): ElementName {
  switch (period) {
    case ChartPeriod.HOUR:
      return ElementName.TimeFrame1H
    case ChartPeriod.DAY:
      return ElementName.TimeFrame1D
    case ChartPeriod.WEEK:
      return ElementName.TimeFrame1W
    case ChartPeriod.MONTH:
      return ElementName.TimeFrame1M
    case ChartPeriod.YEAR:
      return ElementName.TimeFrame1Y
    case ChartPeriod.MAX:
      return ElementName.TimeFrameAll
    default:
      return ElementName.TimeFrame1D
  }
}

export function chartPeriodToTestIdSuffix(period: ChartPeriod): string {
  switch (period) {
    case ChartPeriod.HOUR:
      return '1h'
    case ChartPeriod.DAY:
      return '1d'
    case ChartPeriod.WEEK:
      return '1w'
    case ChartPeriod.MONTH:
      return '1m'
    case ChartPeriod.YEAR:
      return '1y'
    case ChartPeriod.MAX:
      return 'all'
    default:
      return 'unknown'
  }
}

export function chartPeriodToLabel(t: TFunction, period: ChartPeriod): string {
  switch (period) {
    case ChartPeriod.HOUR:
      return t('token.priceExplorer.timeRangeLabel.hour')
    case ChartPeriod.DAY:
      return t('token.priceExplorer.timeRangeLabel.day')
    case ChartPeriod.WEEK:
      return t('token.priceExplorer.timeRangeLabel.week')
    case ChartPeriod.MONTH:
      return t('token.priceExplorer.timeRangeLabel.month')
    case ChartPeriod.YEAR:
      return t('token.priceExplorer.timeRangeLabel.year')
    case ChartPeriod.MAX:
      return t('common.all')
    default:
      return ''
  }
}

export function chartPeriodToTimeLabel(t: TFunction, period: ChartPeriod): string {
  switch (period) {
    case ChartPeriod.HOUR:
      return t('common.thisHour')
    case ChartPeriod.DAY:
      return t('common.today')
    case ChartPeriod.WEEK:
      return t('common.thisWeek')
    case ChartPeriod.MONTH:
      return t('common.thisMonth')
    case ChartPeriod.YEAR:
      return t('common.thisYear')
    case ChartPeriod.MAX:
      return t('common.allTime')
    default:
      return t('common.today')
  }
}
