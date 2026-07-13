import { UniverseChainId } from 'uniswap/src/features/chains/types'
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

  it('uses chain block time: the same short window is fine on a fast chain', () => {
    const startTime = new Date(nowMs + 60_000)
    const endTime = new Date(nowMs + 60_000 + 60_000) // 60s
    // Unichain (1s blocks) → ~60 blocks → valid; Mainnet (12s) → ~5 blocks → still valid here.
    expect(
      getAuctionEmissionScheduleError({ startTime, endTime, chainId: UniverseChainId.Unichain, nowMs }),
    ).toBeUndefined()
  })
})
