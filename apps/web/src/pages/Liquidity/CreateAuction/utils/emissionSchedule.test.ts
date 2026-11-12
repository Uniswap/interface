import { UniverseChainId } from '@universe/chains'
import { describe, expect, it } from 'vitest'
import {
  EmissionScheduleError,
  getAuctionEmissionScheduleError,
  getAuctionEmissionScheduleIssue,
} from '~/pages/Liquidity/CreateAuction/utils/emissionSchedule'

const nowMs = 1_000_000_000_000
const DAY_MS = 24 * 60 * 60 * 1000

describe('getAuctionEmissionScheduleError', () => {
  it('returns undefined when inputs are incomplete', () => {
    expect(
      getAuctionEmissionScheduleError({ startTime: undefined, endTime: undefined, chainId: undefined, nowMs }),
    ).toBeUndefined()
    expect(
      getAuctionEmissionScheduleError({
        startTime: new Date(nowMs),
        endTime: undefined,
        chainId: UniverseChainId.Mainnet,
        nowMs,
      }),
    ).toBeUndefined()
  })

  it('returns undefined when end is not after start', () => {
    const startTime = new Date(nowMs + 60_000)
    expect(
      getAuctionEmissionScheduleError({ startTime, endTime: startTime, chainId: UniverseChainId.Unichain, nowMs }),
    ).toBeUndefined()
  })

  it('flags a too-short window on a slow chain (start/end round within one block)', () => {
    const startTime = new Date(nowMs + 60_000)
    const endTime = new Date(nowMs + 60_000 + 6_000) // 6s < one 12s Mainnet block
    expect(getAuctionEmissionScheduleError({ startTime, endTime, chainId: UniverseChainId.Mainnet, nowMs })).toBe(
      EmissionScheduleError.WindowTooShort,
    )
  })

  it('accepts a normal multi-day window', () => {
    const startTime = new Date(nowMs + 60_000)
    const endTime = new Date(startTime.getTime() + 5 * 24 * 60 * 60 * 1000)
    expect(
      getAuctionEmissionScheduleError({ startTime, endTime, chainId: UniverseChainId.Unichain, nowMs }),
    ).toBeUndefined()
  })

  describe('pre-bid window', () => {
    // 12s Mainnet blocks. The pre-bid window is added in FRONT of the chosen dates, so the
    // auction opens at `preBidStartTime` and emission still runs `startTime -> endTime`.
    const preBidStartTime = new Date(nowMs + 60_000)
    const startTime = new Date(preBidStartTime.getTime() + 10 * 60_000)
    const endTime = new Date(startTime.getTime() + 30 * 60_000)

    it('accepts a valid window', () => {
      expect(
        getAuctionEmissionScheduleError({
          startTime,
          endTime,
          preBidStartTime,
          chainId: UniverseChainId.Mainnet,
          nowMs,
        }),
      ).toBeUndefined()
    })

    it('judges the emission span, not the total window: the pre-bid length does not change the verdict', () => {
      // The SDK's ramp is `endBlock - startBlock - prebidBlocks - 1`, and the pre-bid slice is
      // exactly `emissionStartBlock - startBlock`, so the auction-open terms cancel and the ramp
      // is a function of `startTime -> endTime` alone. This test pins that equivalence: if a
      // future curve makes the pre-bid length bite, this goes red instead of the wizard silently
      // passing a config the backend would reject.
      const withoutWindow = getAuctionEmissionScheduleError({
        startTime,
        endTime,
        chainId: UniverseChainId.Mainnet,
        nowMs,
      })

      for (const minutesOfPreBid of [1, 10, 120]) {
        expect(
          getAuctionEmissionScheduleError({
            startTime,
            endTime,
            preBidStartTime: new Date(startTime.getTime() - minutesOfPreBid * 60_000),
            chainId: UniverseChainId.Mainnet,
            nowMs,
          }),
        ).toBe(withoutWindow)
      }
    })

    it('still flags an emission span too short for the ramp', () => {
      // 6s of emission on a 12s chain — under a single block, regardless of the pre-bid window.
      expect(
        getAuctionEmissionScheduleError({
          startTime,
          endTime: new Date(startTime.getTime() + 6_000),
          preBidStartTime,
          chainId: UniverseChainId.Mainnet,
          nowMs,
        }),
      ).toBe(EmissionScheduleError.WindowTooShort)
    })

    it('leaves an out-of-order pre-bid start to the dedicated range validation', () => {
      // Not a schedule problem, and must not reach the SDK as a negative pre-bid window.
      expect(
        getAuctionEmissionScheduleError({
          startTime,
          endTime,
          preBidStartTime: startTime,
          chainId: UniverseChainId.Mainnet,
          nowMs,
        }),
      ).toBeUndefined()
    })
  })

  it('uses chain block time: the same short window is fine on a fast chain', () => {
    const startTime = new Date(nowMs + 60_000)
    const endTime = new Date(nowMs + 60_000 + 60_000) // 60s
    // Unichain (1s blocks) → ~60 blocks → valid; Mainnet (12s) → ~5 blocks → still valid here.
    expect(
      getAuctionEmissionScheduleError({ startTime, endTime, chainId: UniverseChainId.Unichain, nowMs }),
    ).toBeUndefined()
  })

  describe('too-long window (more than 10,000,000 emission blocks)', () => {
    // Expected values are hand-computed from each chain's fixed block time, deliberately not
    // derived from the SDK: Arbitrum 0.25s → 2,500,000s ≈ 28.94 days, Robinhood 0.1s ≈ 11.57 days,
    // Unichain 1s ≈ 115.74 days.
    const startTime = new Date(nowMs + 60_000)

    it('flags the window with the longest emission window that fits, in whole days', () => {
      expect(
        getAuctionEmissionScheduleIssue({
          startTime,
          endTime: new Date(startTime.getTime() + 29 * DAY_MS),
          chainId: UniverseChainId.ArbitrumOne,
          nowMs,
        }),
      ).toEqual({ error: EmissionScheduleError.WindowTooLong, maxDurationDays: 28 })
      expect(
        getAuctionEmissionScheduleIssue({
          startTime,
          endTime: new Date(startTime.getTime() + 12 * DAY_MS),
          chainId: UniverseChainId.Robinhood,
          nowMs,
        }),
      ).toEqual({ error: EmissionScheduleError.WindowTooLong, maxDurationDays: 11 })
      expect(
        getAuctionEmissionScheduleIssue({
          startTime,
          endTime: new Date(startTime.getTime() + 116 * DAY_MS),
          chainId: UniverseChainId.Unichain,
          nowMs,
        }),
      ).toEqual({ error: EmissionScheduleError.WindowTooLong, maxDurationDays: 115 })
    })

    it('reports it as WindowTooLong rather than Overshoot through the error-only helper', () => {
      expect(
        getAuctionEmissionScheduleError({
          startTime,
          endTime: new Date(startTime.getTime() + 29 * DAY_MS),
          chainId: UniverseChainId.ArbitrumOne,
          nowMs,
        }),
      ).toBe(EmissionScheduleError.WindowTooLong)
    })

    it('accepts exactly 10,000,000 emission blocks and rejects one second more', () => {
      // 10,000,000s at 1s/block = 10,000,000 blocks; +1s = 10,000,001.
      expect(
        getAuctionEmissionScheduleIssue({
          startTime,
          endTime: new Date(startTime.getTime() + 10_000_000_000),
          chainId: UniverseChainId.Unichain,
          nowMs,
        }),
      ).toBeUndefined()
      expect(
        getAuctionEmissionScheduleIssue({
          startTime,
          endTime: new Date(startTime.getTime() + 10_000_001_000),
          chainId: UniverseChainId.Unichain,
          nowMs,
        }),
      ).toEqual({ error: EmissionScheduleError.WindowTooLong, maxDurationDays: 115 })
    })

    it('accepts a window of the reported maximum', () => {
      for (const [chainId, maxDurationDays] of [
        [UniverseChainId.ArbitrumOne, 28],
        [UniverseChainId.Robinhood, 11],
        [UniverseChainId.Unichain, 115],
      ] as const) {
        expect(
          getAuctionEmissionScheduleIssue({
            startTime,
            endTime: new Date(startTime.getTime() + maxDurationDays * DAY_MS),
            chainId,
            nowMs,
          }),
        ).toBeUndefined()
      }
    })

    it('does not count the pre-bid window toward the limit', () => {
      // 28 days of emission fits on Arbitrum; 5 more days of pre-bid in front would not if counted.
      expect(
        getAuctionEmissionScheduleIssue({
          startTime: new Date(startTime.getTime() + 5 * DAY_MS),
          endTime: new Date(startTime.getTime() + 33 * DAY_MS),
          preBidStartTime: startTime,
          chainId: UniverseChainId.ArbitrumOne,
          nowMs,
        }),
      ).toBeUndefined()
    })
  })

  describe('Base Denim (2s → 200ms blocks at unix 1793901601)', () => {
    const denimMs = 1_793_901_601_000
    const beforeDenimNowMs = denimMs - 2 * 60 * 60 * 1000

    it('flags a 2s window before Denim (one 2s block)', () => {
      const startTime = new Date(beforeDenimNowMs + 60_000)
      const endTime = new Date(startTime.getTime() + 2_000)
      expect(
        getAuctionEmissionScheduleError({ startTime, endTime, chainId: UniverseChainId.Base, nowMs: beforeDenimNowMs }),
      ).toBe(EmissionScheduleError.WindowTooShort)
    })

    it('accepts the same 2s window after Denim (ten 200ms blocks), judged from before activation', () => {
      const startTime = new Date(denimMs + 60_000)
      const endTime = new Date(startTime.getTime() + 2_000)
      expect(
        getAuctionEmissionScheduleError({ startTime, endTime, chainId: UniverseChainId.Base, nowMs: beforeDenimNowMs }),
      ).toBeUndefined()
    })
  })
})
