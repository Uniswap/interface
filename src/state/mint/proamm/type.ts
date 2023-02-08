export enum Field {
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B',
}

export enum Bound {
  LOWER = 'LOWER',
  UPPER = 'UPPER',
}

export enum RANGE {
  FULL_RANGE = 'FULL_RANGE',
  SAFE = 'SAFE',
  COMMON = 'COMMON',
  EXPERT = 'EXPERT',
}

export type FullRange = true

export type Point = 0 | 1 | 2 | 3 | 4 | 5

export enum TimeframeOptions {
  FOUR_HOURS = '4 hours',
  ONE_DAY = '1 day',
  THERE_DAYS = '3 days',
  WEEK = '1 week',
  MONTH = '1 month',
  THREE_MONTHS = '3 months',
  YEAR = '1 year',
  ALL_TIME = 'All time',
}
