import { ALL_SUPPORTED_CHAIN_IDS, SupportedChainId } from './chains'

describe('chains', () => {
  describe('ALL_SUPPORTED_CHAIN_IDS', () => {
    it('contains all the values in the SupportedChainId enum', () => {
      Object.values(SupportedChainId).forEach((chainId) => {
        if (typeof chainId === 'number') expect(ALL_SUPPORTED_CHAIN_IDS.includes(chainId as number)).toBeTruthy()
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
