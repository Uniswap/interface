import { UniverseChainId } from '@universe/chains'
import { getChainIdFromChainUrlParam, getChainUrlParam } from '~/utils/params/chainParams'

describe('getChainFromChainUrlParam', () => {
  it('should return true for valid chain slug', () => {
    const validChainName = 'ethereum'
    expect(getChainIdFromChainUrlParam(validChainName)).toBe(UniverseChainId.Mainnet)
  })

  it('should return false for undefined chain slug', () => {
    const undefinedChainName = undefined
    expect(getChainIdFromChainUrlParam(undefinedChainName)).toBe(undefined)
  })

  it('should return false for invalid chain slug', () => {
    const invalidChainName = 'invalidchain'
    expect(getChainIdFromChainUrlParam(invalidChainName)).toBe(undefined)
  })

  it('should return false for a misconfigured chain slug', () => {
    const invalidChainName = 'eThErEuM'
    expect(getChainIdFromChainUrlParam(invalidChainName)).toBe(undefined)
  })
})

describe('getChainUrlParam', () => {
  it('should return url param for ethereum', () => {
    expect(getChainUrlParam(UniverseChainId.Mainnet)).toBe('ethereum')
  })

  it('should return url param for unichain sepolia', () => {
    expect(getChainUrlParam(UniverseChainId.UnichainSepolia)).toBe('unichain_sepolia')
  })

  it('should return url param for megaeth', () => {
    expect(getChainUrlParam(UniverseChainId.MegaETH)).toBe('megaeth')
  })
})
