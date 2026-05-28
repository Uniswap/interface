import { getWrappedNativeAddress, getWrappedNativeAddressWithThrow } from 'uniswap/src/constants/addresses'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

describe('getWrappedNativeAddress', () => {
  it('returns WETH address for Mainnet', () => {
    expect(getWrappedNativeAddress(UniverseChainId.Mainnet)).toBeDefined()
  })

  it('returns undefined for Tempo', () => {
    expect(getWrappedNativeAddress(UniverseChainId.Tempo)).toBeUndefined()
  })
})

describe('getWrappedNativeAddressWithThrow', () => {
  it('returns address for Mainnet', () => {
    expect(getWrappedNativeAddressWithThrow(UniverseChainId.Mainnet)).toEqual(expect.any(String))
  })

  it('throws for Tempo', () => {
    expect(() => getWrappedNativeAddressWithThrow(UniverseChainId.Tempo)).toThrow()
  })
})
