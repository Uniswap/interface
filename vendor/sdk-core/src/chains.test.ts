import { ChainId, getAverageBlockTimeSecs, secondsToBlocks } from './chains'

describe('getAverageBlockTimeSecs', () => {
  it('returns the registered block time for a known chain', () => {
    expect(getAverageBlockTimeSecs(ChainId.MAINNET)).toEqual(12)
    expect(getAverageBlockTimeSecs(ChainId.ARBITRUM_ONE)).toEqual(0.25)
    expect(getAverageBlockTimeSecs(ChainId.ROBINHOOD)).toEqual(0.1)
    expect(getAverageBlockTimeSecs(ChainId.MEGAETH)).toEqual(1)
    expect(getAverageBlockTimeSecs(ChainId.ARC)).toEqual(0.48)
    expect(getAverageBlockTimeSecs(ChainId.INK)).toEqual(1)
  })

  it('throws on unregistered chainId', () => {
    expect(() => getAverageBlockTimeSecs(99999)).toThrow(/unsupported chainId 99999/)
  })
})

describe('secondsToBlocks', () => {
  it('converts wallclock seconds to a block count using ceil', () => {
    expect(secondsToBlocks(8, ChainId.MAINNET)).toEqual(1) // ceil(8/12)
    expect(secondsToBlocks(8, ChainId.ARBITRUM_ONE)).toEqual(32) // ceil(8/0.25)
    expect(secondsToBlocks(8, ChainId.TEMPO)).toEqual(16) // ceil(8/0.5)
    expect(secondsToBlocks(8, ChainId.MEGAETH)).toEqual(8) // ceil(8/1)
    expect(secondsToBlocks(8, ChainId.ARC)).toEqual(17) // ceil(8/0.48)
    expect(secondsToBlocks(8, ChainId.ROBINHOOD)).toEqual(80) // ceil(8/0.1)
    expect(secondsToBlocks(8, ChainId.INK)).toEqual(8) // ceil(8/1)
    expect(secondsToBlocks(1, ChainId.MAINNET)).toEqual(1) // ceil(1/12) — rounds up to a full block
  })

  it('propagates throw on unregistered chainId', () => {
    expect(() => secondsToBlocks(10, 99999)).toThrow(/unsupported chainId 99999/)
  })
})
