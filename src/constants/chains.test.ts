import { ChainId as SdkChainId } from '@uniswap/sdk-core'

import { ALL_SUPPORTED_CHAIN_IDS, ChainId } from './chains'

describe('ChainIds', () => {
  describe('ChainId', () => {
    it('derives from sdk-core', () => {
      const SDKChains = Object.values(SdkChainId)
        .filter((chainId) => typeof chainId === 'number')
        .map((value) => value.toString())
      const InterfaceChains = Object.values(ChainId)
        .filter((chainId) => typeof chainId === 'number')
        .map((value) => value.toString())
      const isSubset = InterfaceChains.every((value) => SDKChains.includes(value))
      expect(isSubset).toBe(true)
    })
  })

  describe('ALL_SUPPORTED_CHAIN_IDS', () => {
    it('contains all the values in the ChainId enum', () => {
      Object.values(ChainId)
        .filter((chainId) => typeof chainId === 'number')
        .forEach((chainId) => {
          expect(ALL_SUPPORTED_CHAIN_IDS.includes(chainId as number)).toBeTruthy()
        })
    })

    it('contains no duplicates', () => {
      const set = new Set<number>()
      ALL_SUPPORTED_CHAIN_IDS.forEach((chainId) => {
        expect(set.has(chainId)).toEqual(false)
        set.add(chainId)
      })
    })

    it('all values are in the ChainId mapping', () => {
      ALL_SUPPORTED_CHAIN_IDS.forEach((chainId) => {
        // takes advantage of the reverse mapping
        expect(ChainId[chainId]).toBeTruthy()
      })
    })

    it('all values are numeric', () => {
      expect(ALL_SUPPORTED_CHAIN_IDS.every((chainId) => typeof chainId === 'number')).toBeTruthy()
    })
  })
})
