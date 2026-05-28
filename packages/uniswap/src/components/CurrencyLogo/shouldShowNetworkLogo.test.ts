import { shouldShowNetworkLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

describe('shouldShowNetworkLogo', () => {
  it('returns false when chainId is missing', () => {
    expect(
      shouldShowNetworkLogo({
        chainId: undefined,
        alwaysShowNetworkLogo: false,
        hideNetworkLogo: false,
        showMainnetNetworkLogo: true,
      }),
    ).toBe(false)
    expect(
      shouldShowNetworkLogo({
        chainId: null,
        alwaysShowNetworkLogo: false,
        hideNetworkLogo: false,
        showMainnetNetworkLogo: true,
      }),
    ).toBe(false)
  })

  it('returns true when alwaysShowNetworkLogo is true and chainId is set', () => {
    expect(
      shouldShowNetworkLogo({
        chainId: UniverseChainId.Mainnet,
        alwaysShowNetworkLogo: true,
        hideNetworkLogo: true,
        showMainnetNetworkLogo: false,
      }),
    ).toBe(true)
  })

  it('returns false when alwaysShowNetworkLogo is true but chainId is missing', () => {
    expect(
      shouldShowNetworkLogo({
        chainId: undefined,
        alwaysShowNetworkLogo: true,
        hideNetworkLogo: false,
        showMainnetNetworkLogo: true,
      }),
    ).toBe(false)
  })

  it('returns false when hideNetworkLogo is true (non-mainnet)', () => {
    expect(
      shouldShowNetworkLogo({
        chainId: UniverseChainId.Base,
        alwaysShowNetworkLogo: false,
        hideNetworkLogo: true,
        showMainnetNetworkLogo: false,
      }),
    ).toBe(false)
  })

  it('returns true for a non-mainnet chain when not hidden', () => {
    expect(
      shouldShowNetworkLogo({
        chainId: UniverseChainId.ArbitrumOne,
        alwaysShowNetworkLogo: false,
        hideNetworkLogo: false,
        showMainnetNetworkLogo: false,
      }),
    ).toBe(true)
  })

  it('returns false for mainnet when showMainnetNetworkLogo is false', () => {
    expect(
      shouldShowNetworkLogo({
        chainId: UniverseChainId.Mainnet,
        alwaysShowNetworkLogo: false,
        hideNetworkLogo: false,
        showMainnetNetworkLogo: false,
      }),
    ).toBe(false)
  })

  it('returns true for mainnet when showMainnetNetworkLogo is true', () => {
    expect(
      shouldShowNetworkLogo({
        chainId: UniverseChainId.Mainnet,
        alwaysShowNetworkLogo: false,
        hideNetworkLogo: false,
        showMainnetNetworkLogo: true,
      }),
    ).toBe(true)
  })

  it('returns false for mainnet when hidden even if showMainnetNetworkLogo is true', () => {
    expect(
      shouldShowNetworkLogo({
        chainId: UniverseChainId.Mainnet,
        alwaysShowNetworkLogo: false,
        hideNetworkLogo: true,
        showMainnetNetworkLogo: true,
      }),
    ).toBe(false)
  })
})
