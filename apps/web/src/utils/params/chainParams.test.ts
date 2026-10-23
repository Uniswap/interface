import { UniverseChainId } from '@universe/chains'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyField } from 'uniswap/src/types/currency'
import {
  getChainIdFromBackendChain,
  getChainIdFromChainUrlParam,
  getChainUrlParam,
  getParsedChainId,
} from '~/utils/params/chainParams'

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

  it('should return the chain for a valid numeric chain ID', () => {
    expect(getChainIdFromChainUrlParam(String(UniverseChainId.Base))).toBe(UniverseChainId.Base)
  })

  it('should return undefined for an unknown numeric chain ID', () => {
    expect(getChainIdFromChainUrlParam('999999999')).toBeUndefined()
  })

  it('should return false for a misconfigured chain slug', () => {
    const invalidChainName = 'eThErEuM'
    expect(getChainIdFromChainUrlParam(invalidChainName)).toBe(undefined)
  })
})

describe('getParsedChainId', () => {
  it('should parse a chain interface name', () => {
    expect(getParsedChainId({ chain: 'base' })).toBe(UniverseChainId.Base)
  })

  it('should parse a numeric chain ID', () => {
    expect(getParsedChainId({ chain: String(UniverseChainId.Base) })).toBe(UniverseChainId.Base)
  })

  it('should parse a numeric output chain ID', () => {
    expect(getParsedChainId({ outputChain: String(UniverseChainId.ArbitrumOne) }, CurrencyField.OUTPUT)).toBe(
      UniverseChainId.ArbitrumOne,
    )
  })

  it('should not parse a non-canonical numeric value', () => {
    expect(getParsedChainId({ chain: `0${UniverseChainId.Base}` })).toBeUndefined()
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

describe('getChainIdFromBackendChain', () => {
  it('should return url param for ethereum', () => {
    expect(getChainIdFromBackendChain(toGraphQLChain(UniverseChainId.Mainnet))).toBe(UniverseChainId.Mainnet)
  })

  it('should return url param for unichain sepolia', () => {
    expect(getChainIdFromBackendChain(toGraphQLChain(UniverseChainId.UnichainSepolia))).toBe(
      UniverseChainId.UnichainSepolia,
    )
  })

  it('should return chain id for megaeth', () => {
    expect(getChainIdFromBackendChain(toGraphQLChain(UniverseChainId.MegaETH))).toBe(UniverseChainId.MegaETH)
  })
})
