import { SupportedChainId } from 'constants/chains'

import chunkArray, { DEFAULT_GAS_REQUIRED } from './chunkArray'

describe('#chunkArray', () => {
  it('size 1', () => {
    expect(chunkArray([1, 2, 3], SupportedChainId.MAINNET, 1)).toEqual([[1], [2], [3]])
    expect(chunkArray([1, 2, 3], SupportedChainId.MAINNET, DEFAULT_GAS_REQUIRED)).toEqual([[1], [2], [3]])
  })
  it('size gt items', () => {
    expect(chunkArray([1, 2, 3], SupportedChainId.MAINNET, DEFAULT_GAS_REQUIRED * 3 + 1)).toEqual([[1, 2, 3]])
  })
  it('size exact half', () => {
    expect(chunkArray([1, 2, 3, 4], SupportedChainId.MAINNET, DEFAULT_GAS_REQUIRED * 2 + 1)).toEqual([
      [1, 2],
      [3, 4],
    ])
  })
  describe('with gas limit override', () => {
    it('size 1', () => {
      expect(
        chunkArray([1, 2, 3], SupportedChainId.ARBITRUM_ONE, DEFAULT_GAS_REQUIRED * 3 + 1, {
          [SupportedChainId.ARBITRUM_ONE]: 1,
        })
      ).toEqual([[1], [2], [3]])
    })
    it('size gt items', () => {
      expect(
        chunkArray([1, 2, 3], SupportedChainId.ARBITRUM_ONE, 1, {
          [SupportedChainId.ARBITRUM_ONE]: DEFAULT_GAS_REQUIRED * 3 + 1,
        })
      ).toEqual([[1, 2, 3]])
    })
    it('size exact half', () => {
      expect(
        chunkArray([1, 2, 3, 4], SupportedChainId.ARBITRUM_ONE, 1, {
          [SupportedChainId.ARBITRUM_ONE]: DEFAULT_GAS_REQUIRED * 2 + 1,
        })
      ).toEqual([
        [1, 2],
        [3, 4],
      ])
    })
  })
})
