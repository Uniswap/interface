import { UniverseChainId } from '@universe/chains'
import { describe, expect, it } from 'vitest'
import {
  EmissionScheduleError,
  getAuctionEmissionScheduleError,
} from '~/pages/Liquidity/CreateAuction/utils/emissionSchedule'

const nowMs = 1_000_000_000_000

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
