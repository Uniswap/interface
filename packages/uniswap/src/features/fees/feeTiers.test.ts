import { DEFAULT_FEE_TIER_PAIRS } from 'uniswap/src/features/fees/feeTiers'
import { describe, expect, it } from 'vitest'

describe('new default fee tier pairing constants', () => {
  it('pins the spec pairing: 0.75+0.2, 3.75+1, 25+4, 90+10 (bps)', () => {
    expect(DEFAULT_FEE_TIER_PAIRS.map(({ newBps, protocolBps }) => [newBps, protocolBps])).toEqual([
      [0.75, 0.2],
      [3.75, 1],
      [25, 4],
      [90, 10],
    ])
  })
})
