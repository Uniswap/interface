import type { TFunction } from 'i18next'

export const MS_PER_DAY = 24 * 60 * 60 * 1000

export const MS_PER_HOUR = 60 * 60 * 1000

const MS_PER_MINUTE = 60 * 1000

/** Minimum lead before auction start when choosing dates/times (picker clamps to this). */
export const CREATE_AUCTION_MIN_START_LEAD_TIME_MINUTES = 5

/** Minimum time until start required to advance past configure (picker stays at 5m; this avoids blocking if the user waits on the step). */
export const CREATE_AUCTION_MIN_LEAD_MINUTES_TO_PROCEED = 1

export const DEFAULT_AUCTION_DURATION_DAYS = 5

/** Earliest selectable auction start (`minStartDate` on the range picker). */
export function getMinStartTime(): Date {
  const min = new Date()
  min.setMinutes(min.getMinutes() + CREATE_AUCTION_MIN_START_LEAD_TIME_MINUTES)
  return min
}

/** Earliest start time that still allows continuing configure (now + proceed buffer). */
export function getMinAuctionStartTimeToProceed(): Date {
  const min = new Date()
  min.setMinutes(min.getMinutes() + CREATE_AUCTION_MIN_LEAD_MINUTES_TO_PROCEED)
  return min
}

export function computeDurationDays({ startTime, endTime }: { startTime: Date; endTime: Date }): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / MS_PER_DAY)
}

export function computeDurationHoursCeil({ startTime, endTime }: { startTime: Date; endTime: Date }): number {
  const ms = endTime.getTime() - startTime.getTime()
  return Math.max(1, Math.ceil(ms / MS_PER_HOUR))
}

export function defaultEndTimeFor(startTime: Date): Date {
  return new Date(startTime.getTime() + DEFAULT_AUCTION_DURATION_DAYS * MS_PER_DAY)
}

/** Human-readable auction length using hours when under 24h (matches review step). */
export function formatReviewAuctionDuration(
  { startTime, endTime }: { startTime: Date; endTime: Date },
  t: TFunction,
): string {
  const durationMs = endTime.getTime() - startTime.getTime()
  if (durationMs < MS_PER_DAY) {
    return t('common.hour.count', {
      count: computeDurationHoursCeil({ startTime, endTime }),
    })
  }
  return t('common.day.count', {
    count: computeDurationDays({ startTime, endTime }),
  })
}

/** Localized length for a lead time given in whole minutes (reuses `common.minutes` / `common.hour` / `common.day`). */
export function formatLeadMinutesLabel(minutes: number, t: TFunction): string {
  const durationMs = minutes * MS_PER_MINUTE
  if (durationMs < MS_PER_HOUR) {
    return t('common.minutes.withCount', { count: Math.max(1, minutes) })
  }
  if (durationMs < MS_PER_DAY) {
    return t('common.hour.count', {
      count: Math.max(1, Math.ceil(durationMs / MS_PER_HOUR)),
    })
  }
  return t('common.day.count', {
    count: Math.max(1, Math.ceil(durationMs / MS_PER_DAY)),
  })
}
