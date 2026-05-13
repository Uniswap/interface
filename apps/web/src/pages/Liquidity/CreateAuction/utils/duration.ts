import type { TFunction } from 'i18next'

export const MS_PER_DAY = 24 * 60 * 60 * 1000

export const MS_PER_HOUR = 60 * 60 * 1000

export const DEFAULT_AUCTION_DURATION_DAYS = 5

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
