import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getChainIdFromBackendChain, getChainIdFromChainUrlParam, getChainUrlParam } from 'utils/chainParams'

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
})

describe('getChainIdFromBackendChain', () => {
  it('should return url param for ethereum', () => {
    expect(getChainIdFromBackendChain(toGraphQLChain(UniverseChainId.Mainnet))).toBe(UniverseChainId.Mainnet)
  })

  it('should return url param for unichain sepolia', () => {
    expect(getChainIdFromBackendChain(toGraphQLChain(UniverseChainId.UnichainSepolia))).toBe(
      UniverseChainId.UnichainSepolia,
    )
  })
})
