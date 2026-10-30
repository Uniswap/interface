import { AuctionTimePhase, getAuctionTimePhase } from 'uniswap/src/features/toucan/auctionTimePhase'

describe(getAuctionTimePhase, () => {
  const nowMs = 1_000

  it.each([
    [
      { startTimeMs: 2_000, endTimeMs: 3_000 },
      { phase: AuctionTimePhase.Upcoming, startTimeMs: 2_000 },
    ],
    [
      { startTimeMs: 2_000, endTimeMs: undefined },
      { phase: AuctionTimePhase.Upcoming, startTimeMs: 2_000 },
    ],
    [
      { startTimeMs: 500, endTimeMs: 3_000 },
      { phase: AuctionTimePhase.Live, endTimeMs: 3_000 },
    ],
    [{ startTimeMs: 500, endTimeMs: 1_000 }, { phase: AuctionTimePhase.Ended }],
    [{ startTimeMs: undefined, endTimeMs: 500 }, { phase: AuctionTimePhase.Ended }],
    [{ startTimeMs: 500, endTimeMs: undefined }, { phase: AuctionTimePhase.Unknown }],
    [{ startTimeMs: undefined, endTimeMs: 3_000 }, { phase: AuctionTimePhase.Unknown }],
    [{ startTimeMs: undefined, endTimeMs: undefined }, { phase: AuctionTimePhase.Unknown }],
  ])('resolves %o', (times, expected) => {
    expect(getAuctionTimePhase({ ...times, nowMs })).toEqual(expected)
  })
})
