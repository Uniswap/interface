import { SupportedChainId as SdkSupportedChainId } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'

import { ALL_SUPPORTED_CHAIN_IDS } from './chains'

describe('ChainIds', () => {
  describe('SupportedChainId', () => {
    it('derives from sdk-core', () => {
      const SDKChains = Object.values(SdkSupportedChainId)
        .filter((chainId) => typeof chainId === 'number')
        .map((value) => value.toString())
      const InterfaceChains = Object.values(SupportedChainId)
        .filter((chainId) => typeof chainId === 'number')
        .map((value) => value.toString())
      const isSubset = InterfaceChains.every((value) => SDKChains.includes(value))
      expect(isSubset).toBe(true)
    })
  })

  describe('ALL_SUPPORTED_CHAIN_IDS', () => {
    it('contains all the values in the SupportedChainId enum', () => {
      Object.values(SupportedChainId)
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

    it('all values are in the SupportedChainId mapping', () => {
      ALL_SUPPORTED_CHAIN_IDS.forEach((chainId) => {
        // takes advantage of the reverse mapping
        expect(SupportedChainId[chainId]).toBeTruthy()
      })
    })

    it('all values are numeric', () => {
      expect(ALL_SUPPORTED_CHAIN_IDS.every((chainId) => typeof chainId === 'number')).toBeTruthy()
    })
  })
})
