import { ONE_DAY_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'
import { describe, expect, it, vi } from 'vitest'
import {
  CREATE_AUCTION_MIN_START_LEAD_TIME_MINUTES,
  DEFAULT_PRE_BID_DURATION_MINUTES,
  getDurationInvalidReason,
  getEffectivePreBidStartTime,
  getMinEmissionStartTime,
  getMinStartTime,
  isPreBidRangeValid,
  seedPreBidWindow,
  shiftEndTimeToPreserveDuration,
} from '~/pages/Liquidity/CreateAuction/utils/duration'

describe('seedPreBidWindow', () => {
  it('places the window in front of a start date that has room for it', () => {
    const startTime = new Date(Date.now() + ONE_DAY_MS)

    const seeded = seedPreBidWindow(startTime)

    expect(seeded.startTime).toBe(startTime)
    expect(startTime.getTime() - seeded.preBidStartTime.getTime()).toBe(
      DEFAULT_PRE_BID_DURATION_MINUTES * ONE_MINUTE_MS,
    )
  })

  it('anchors at the earliest selectable time when no start date is chosen yet', () => {
    const seeded = seedPreBidWindow(undefined)

    // Leaves the start date for the creator — the module's empty state in the design.
    expect(seeded.startTime).toBeUndefined()
    expect(seeded.preBidStartTime.getTime()).toBeGreaterThanOrEqual(
      Date.now() + (CREATE_AUCTION_MIN_START_LEAD_TIME_MINUTES - 1) * ONE_MINUTE_MS,
    )
  })

  it('pushes the start date out when there is no room in front of it', () => {
    // Only just past the minimum lead — clamping the pre-bid start alone would put it at or
    // after the emission start, i.e. a module that is invalid the instant it is added.
    const startTime = new Date(Date.now() + (CREATE_AUCTION_MIN_START_LEAD_TIME_MINUTES + 1) * ONE_MINUTE_MS)

    const seeded = seedPreBidWindow(startTime)

    expect(seeded.startTime).toBeDefined()
    expect(seeded.startTime!.getTime()).toBeGreaterThan(startTime.getTime())
    // The invariant that matters: adding the module always lands in a valid state.
    expect(seeded.preBidStartTime.getTime()).toBeLessThan(seeded.startTime!.getTime())
    expect(seeded.preBidStartTime.getTime()).toBeGreaterThanOrEqual(getMinStartTime().getTime() - ONE_MINUTE_MS)
  })
})

describe('shiftEndTimeToPreserveDuration', () => {
  const START = new Date(Date.now() + ONE_DAY_MS)
  const END = new Date(START.getTime() + 5 * ONE_DAY_MS)

  it('pushes the end date out by the same delta the start date moved', () => {
    const nextStartTime = new Date(START.getTime() + 2 * ONE_DAY_MS)

    const shifted = shiftEndTimeToPreserveDuration({ previousStartTime: START, nextStartTime, endTime: END })

    expect(shifted!.getTime() - nextStartTime.getTime()).toBe(END.getTime() - START.getTime())
  })

  it('pulls the end date back when the start date moves earlier', () => {
    const nextStartTime = new Date(START.getTime() - 30 * 60_000)

    const shifted = shiftEndTimeToPreserveDuration({ previousStartTime: START, nextStartTime, endTime: END })

    expect(shifted!.getTime()).toBe(END.getTime() - 30 * 60_000)
  })

  it('leaves the end date referentially unchanged when the start date did not move', () => {
    const shifted = shiftEndTimeToPreserveDuration({
      previousStartTime: START,
      nextStartTime: new Date(START.getTime()),
      endTime: END,
    })

    expect(shifted).toBe(END)
  })

  it('does nothing when either boundary is unset', () => {
    expect(shiftEndTimeToPreserveDuration({ previousStartTime: undefined, nextStartTime: START, endTime: END })).toBe(
      END,
    )
    expect(shiftEndTimeToPreserveDuration({ previousStartTime: START, nextStartTime: undefined, endTime: END })).toBe(
      END,
    )
    expect(
      shiftEndTimeToPreserveDuration({ previousStartTime: START, nextStartTime: END, endTime: undefined }),
    ).toBeUndefined()
  })

  it('keeps a valid range valid — the end date can never be overtaken by the start it follows', () => {
    const nextStartTime = new Date(END.getTime() + ONE_DAY_MS)

    const shifted = shiftEndTimeToPreserveDuration({ previousStartTime: START, nextStartTime, endTime: END })

    expect(shifted!.getTime()).toBeGreaterThan(nextStartTime.getTime())
  })
})

describe('isPreBidRangeValid', () => {
  it('accepts a window that opens before emission begins, and rejects one that does not', () => {
    const startTime = new Date(Date.now() + ONE_DAY_MS)

    expect(isPreBidRangeValid({ startTime, preBidStartTime: new Date(startTime.getTime() - 60_000) })).toBe(true)
    expect(isPreBidRangeValid({ startTime, preBidStartTime: startTime })).toBe(false)
    expect(isPreBidRangeValid({ startTime, preBidStartTime: new Date(startTime.getTime() + 60_000) })).toBe(false)
  })

  it('accepts no window at all', () => {
    expect(isPreBidRangeValid({ startTime: new Date(Date.now() + ONE_DAY_MS), preBidStartTime: undefined })).toBe(true)
    expect(isPreBidRangeValid({ startTime: undefined, preBidStartTime: undefined })).toBe(true)
  })

  // `seedPreBidWindow(undefined)` produces exactly this state. Pinned because the Duration
  // section's ordering error and the disabled-continue focus both depend on it being invalid:
  // nothing else fires on a missing start date once a window pins `getAuctionOpenTime`.
  it('rejects a window with no emission start to open before', () => {
    expect(
      isPreBidRangeValid({ startTime: undefined, preBidStartTime: seedPreBidWindow(undefined).preBidStartTime }),
    ).toBe(false)
  })
})

describe('getEffectivePreBidStartTime', () => {
  it('keeps the configured window in the manual wizard', () => {
    const preBidStartTime = new Date(Date.now() + ONE_DAY_MS)

    expect(getEffectivePreBidStartTime({ preBidStartTime, isQuickLaunch: false })).toBe(preBidStartTime)
  })

  // Quick launch has no pre-bid module. A value that survived the switch must not reach the wire,
  // nor any surface describing it — the review step's rows and the launch-time staleness guard.
  it('drops a window that survived a switch into quick launch', () => {
    expect(
      getEffectivePreBidStartTime({ preBidStartTime: new Date(Date.now() + ONE_DAY_MS), isQuickLaunch: true }),
    ).toBeUndefined()
  })
})

describe('getDurationInvalidReason', () => {
  const FUTURE_START = new Date(Date.now() + ONE_DAY_MS)
  const FUTURE_END = new Date(Date.now() + 6 * ONE_DAY_MS)

  it('returns undefined for a launchable window', () => {
    expect(
      getDurationInvalidReason({ startTime: FUTURE_START, endTime: FUTURE_END, preBidStartTime: undefined }),
    ).toBeUndefined()
  })

  it('reports the auction open time when the PRE-BID start has gone stale, not the start date', () => {
    // The reachable case: a seeded window sits at now+5m against a now+1m threshold, so ~4 minutes
    // on the step is enough. The emission start is a day out and blameless.
    expect(
      getDurationInvalidReason({
        startTime: FUTURE_START,
        endTime: FUTURE_END,
        preBidStartTime: new Date(Date.now() - 60_000),
      }),
    ).toBe('auction-open-too-soon')
  })

  it('reports the ordering before the range when both are wrong', () => {
    // Ordered on purpose: the first reason is the field to fix first, and every consumer
    // (step gate, inline error, focus target) has to agree on which that is.
    expect(
      getDurationInvalidReason({
        startTime: FUTURE_START,
        endTime: new Date(FUTURE_START.getTime() - 1000),
        preBidStartTime: FUTURE_START,
      }),
    ).toBe('pre-bid-order')
  })

  it('reports the range when the end is not after the start', () => {
    expect(
      getDurationInvalidReason({ startTime: FUTURE_START, endTime: FUTURE_START, preBidStartTime: undefined }),
    ).toBe('range')
  })

  it('treats a seeded window with no start date as an ordering problem', () => {
    const seeded = seedPreBidWindow(undefined)
    expect(seeded.startTime).toBeUndefined()
    expect(
      getDurationInvalidReason({ startTime: undefined, endTime: FUTURE_END, preBidStartTime: seeded.preBidStartTime }),
    ).toBe('pre-bid-order')
  })
})

describe('getMinEmissionStartTime', () => {
  it('uses the picker lead floor when there is no pre-bid window', () => {
    const floor = getMinEmissionStartTime(undefined)
    expect(floor.getTime()).toBeGreaterThan(Date.now())
  })

  it('raises the floor above a future pre-bid start', () => {
    const preBid = new Date(Date.now() + 2 * 60 * 60_000)
    expect(getMinEmissionStartTime(preBid).getTime()).toBe(preBid.getTime() + ONE_MINUTE_MS)
  })

  it('never drops the floor into the past when the pre-bid start has elapsed', () => {
    // Replacing the lead floor instead of raising it would return an hour ago, and the picker
    // would then accept a past emission start. Both floors below are anchored on Date.now(),
    // so freeze the clock: a millisecond tick between the two calls would otherwise make the
    // exact-equality assertion flaky.
    vi.useFakeTimers()
    try {
      const elapsed = new Date(Date.now() - 60 * 60_000)
      const floor = getMinEmissionStartTime(elapsed)
      expect(floor.getTime()).toBeGreaterThan(Date.now())
      expect(floor.getTime()).toBe(getMinEmissionStartTime(undefined).getTime())
    } finally {
      vi.useRealTimers()
    }
  })
})
