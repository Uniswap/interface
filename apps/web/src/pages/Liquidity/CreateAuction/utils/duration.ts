import type { TFunction } from 'i18next'
import { ONE_DAY_MS, ONE_HOUR_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'

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
  return Math.round((endTime.getTime() - startTime.getTime()) / ONE_DAY_MS)
}

export function computeDurationHoursCeil({ startTime, endTime }: { startTime: Date; endTime: Date }): number {
  const ms = endTime.getTime() - startTime.getTime()
  return Math.max(1, Math.ceil(ms / ONE_HOUR_MS))
}

export function defaultEndTimeFor(startTime: Date): Date {
  return new Date(startTime.getTime() + DEFAULT_AUCTION_DURATION_DAYS * ONE_DAY_MS)
}

/**
 * When the auction OPENS for bids — the timestamp the backend turns into the contract's
 * `startBlock`. With a pre-bid window that is the pre-bid start, not the Duration "Start date"
 * (which is where token emission begins).
 *
 * Every rule that concerns the auction's own start — the minimum lead, the launch-time staleness
 * guard, the emission-schedule pre-check — has to read this rather than `startTime`.
 *
 * Overloaded so a caller that has already narrowed `startTime` gets a `Date` back and does not
 * need a `?? startTime` tail, which reads as if this could drop a start time it was handed.
 */
export function getAuctionOpenTime(input: { startTime: Date; preBidStartTime: Date | undefined }): Date
export function getAuctionOpenTime(input: {
  startTime: Date | undefined
  preBidStartTime: Date | undefined
}): Date | undefined
export function getAuctionOpenTime({
  startTime,
  preBidStartTime,
}: {
  startTime: Date | undefined
  preBidStartTime: Date | undefined
}): Date | undefined {
  return preBidStartTime ?? startTime
}

/**
 * The pre-bid start the request will actually carry. Pre-bid is a manual-wizard module and quick
 * launch never renders one, so a value that survived a switch into quick launch must not reach the
 * wire — nor any surface that claims to describe the wire. One export, read by the request
 * builder, the launch-time staleness guard and the review step's date rows, so a surface that
 * describes the transaction cannot drift from it.
 */
export function getEffectivePreBidStartTime({
  preBidStartTime,
  isQuickLaunch,
}: {
  preBidStartTime: Date | undefined
  isQuickLaunch: boolean
}): Date | undefined {
  return isQuickLaunch ? undefined : preBidStartTime
}

/**
 * Whether the pre-bid window is ordered correctly: bidding must open strictly before emission
 * begins. No window at all is valid. A window with no start date is NOT valid: there is no
 * boundary for bidding to open before, so the ordering cannot hold — `seedPreBidWindow(undefined)`
 * produces exactly that state and it is the one thing the creator has to fix. `duration.test.ts`
 * pins all four cases; callers reach it through {@link getDurationInvalidReason}.
 */
export function isPreBidRangeValid({
  startTime,
  preBidStartTime,
}: {
  startTime: Date | undefined
  preBidStartTime: Date | undefined
}): boolean {
  if (!preBidStartTime) {
    return true
  }
  return !!startTime && preBidStartTime.getTime() < startTime.getTime()
}

/**
 * Why the Duration inputs are not yet launchable, or `undefined` when they are.
 *
 * One export because three consumers need the same answer for different purposes — the step gate
 * (any reason blocks), the inline error (which message), and the disabled-Continue affordance
 * (which field to open). Sharing it keeps the predicate set and its precedence in one place.
 *
 * Ordered: the reasons are not mutually exclusive, and the first one is the field the creator has
 * to fix first. `auction-open-too-soon` names the auction's OPEN time, which is the pre-bid start
 * when a window is set — so it is not always the Duration card's start date, and callers routing
 * focus must read {@link getAuctionOpenTime} rather than assume.
 */
export type DurationInvalidReason = 'auction-open-too-soon' | 'pre-bid-order' | 'range'

export function getDurationInvalidReason({
  startTime,
  endTime,
  preBidStartTime,
}: {
  startTime: Date | undefined
  endTime: Date | undefined
  preBidStartTime: Date | undefined
}): DurationInvalidReason | undefined {
  const auctionOpenTime = getAuctionOpenTime({ startTime, preBidStartTime })
  if (!auctionOpenTime || auctionOpenTime.getTime() < getMinAuctionStartTimeToProceed().getTime()) {
    return 'auction-open-too-soon'
  }
  if (!isPreBidRangeValid({ startTime, preBidStartTime })) {
    return 'pre-bid-order'
  }
  if (!endTime || !startTime || endTime.getTime() <= startTime.getTime()) {
    return 'range'
  }
  return undefined
}

/**
 * Earliest selectable emission start (the Duration card's `minStartDate`).
 *
 * A pre-bid window RAISES this floor — emission must begin strictly after bidding opens — but
 * never lowers it below the picker's own lead time. Replacing rather than raising would put the
 * floor in the past once the pre-bid start elapses, letting the picker accept a past emission
 * start; Continue still blocks that, but recovery then takes two edits, because fixing the
 * pre-bid start leaves a past start date that trips the ordering check.
 */
export function getMinEmissionStartTime(preBidStartTime: Date | undefined): Date {
  const leadFloor = getMinStartTime()
  if (!preBidStartTime) {
    return leadFloor
  }
  return new Date(Math.max(preBidStartTime.getTime() + ONE_MINUTE_MS, leadFloor.getTime()))
}

/** Length of the pre-bid window seeded when the creator first adds the module. */
export const DEFAULT_PRE_BID_DURATION_MINUTES = 15

/**
 * Where to place a freshly added pre-bid window, and where the emission start has to move
 * to accommodate it.
 *
 * The window is seeded {@link DEFAULT_PRE_BID_DURATION_MINUTES} before the chosen start
 * date. Two cases need care:
 *  - No start date yet: anchor the window at the earliest selectable time and leave the
 *    start date for the creator to pick, matching the empty state in the design.
 *  - A start date too close to now to fit the window in front of it: clamping alone would
 *    seed a pre-bid start at or after the emission start, i.e. an immediately invalid
 *    module. Push the start date out instead, so adding the module always lands in a valid
 *    state. The move is visible right away — the same value is mirrored into the module's
 *    "Pre-bid end date" field.
 */
export function seedPreBidWindow(startTime: Date | undefined): { preBidStartTime: Date; startTime: Date | undefined } {
  const earliest = getMinStartTime()
  const windowMs = DEFAULT_PRE_BID_DURATION_MINUTES * ONE_MINUTE_MS

  if (!startTime) {
    return { preBidStartTime: earliest, startTime: undefined }
  }

  const desired = new Date(startTime.getTime() - windowMs)
  if (desired.getTime() >= earliest.getTime()) {
    return { preBidStartTime: desired, startTime }
  }
  return { preBidStartTime: earliest, startTime: new Date(earliest.getTime() + windowMs) }
}

/**
 * The end date that keeps the configured auction length when the pre-bid module moves the
 * emission start — seeding a window pushes the start out to make room for it, and the
 * mirrored "Pre-bid end date" field edits that same boundary directly. Leaving the end date
 * alone there would silently resize the auction, and can even leave it before the start.
 *
 * The same delta applies in either direction, so pulling the boundary back in shortens the
 * shift by exactly as much as pushing it out lengthened it. Derived one way only — the end
 * date never feeds back into the start — so the two mirrored fields cannot oscillate. A
 * zero delta returns the same instance, so an untouched start date leaves the end date
 * referentially unchanged.
 */
export function shiftEndTimeToPreserveDuration({
  previousStartTime,
  nextStartTime,
  endTime,
}: {
  previousStartTime: Date | undefined
  nextStartTime: Date | undefined
  endTime: Date | undefined
}): Date | undefined {
  if (!endTime || !previousStartTime || !nextStartTime) {
    return endTime
  }
  const deltaMs = nextStartTime.getTime() - previousStartTime.getTime()
  if (deltaMs === 0) {
    return endTime
  }
  return new Date(endTime.getTime() + deltaMs)
}

/** Human-readable auction length using hours when under 24h (matches review step). */
export function formatReviewAuctionDuration(
  { startTime, endTime }: { startTime: Date; endTime: Date },
  t: TFunction,
): string {
  const durationMs = endTime.getTime() - startTime.getTime()
  if (durationMs < ONE_DAY_MS) {
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
  const durationMs = minutes * ONE_MINUTE_MS
  if (durationMs < ONE_HOUR_MS) {
    return t('common.minutes.withCount', { count: Math.max(1, minutes) })
  }
  if (durationMs < ONE_DAY_MS) {
    return t('common.hour.count', {
      count: Math.max(1, Math.ceil(durationMs / ONE_HOUR_MS)),
    })
  }
  return t('common.day.count', {
    count: Math.max(1, Math.ceil(durationMs / ONE_DAY_MS)),
  })
}
