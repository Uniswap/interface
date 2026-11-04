import { UniverseChainId } from '@universe/chains'
import { getRestMultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/getMultichainTokenEntry'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { describe, expect, it } from 'vitest'

describe(getRestMultichainTokenEntry, () => {
  it('normalizes an empty native address to the canonical native entry', () => {
    expect(
      getRestMultichainTokenEntry({ chainIdKey: String(UniverseChainId.Bnb), address: '' }, [UniverseChainId.Bnb]),
    ).toEqual({
      chainId: UniverseChainId.Bnb,
      address: getNativeAddress(UniverseChainId.Bnb),
      isNative: true,
    })
  })

  it('normalizes an explicit native address to the canonical native entry', () => {
    expect(
      getRestMultichainTokenEntry(
        { chainIdKey: String(UniverseChainId.Bnb), address: getNativeAddress(UniverseChainId.Bnb) },
        [UniverseChainId.Bnb],
      ),
    ).toEqual({
      chainId: UniverseChainId.Bnb,
      address: getNativeAddress(UniverseChainId.Bnb),
      isNative: true,
    })
  })

  it('preserves a contract token address', () => {
    const address = '0xb8c77482e45f1f44de1745f52c74426c631bdd52'

    expect(
      getRestMultichainTokenEntry({ chainIdKey: String(UniverseChainId.Mainnet), address }, [UniverseChainId.Mainnet]),
    ).toEqual({
      chainId: UniverseChainId.Mainnet,
      address,
      isNative: false,
    })
  })

  it('excludes a feature-gated chain', () => {
    expect(
      getRestMultichainTokenEntry({ chainIdKey: String(UniverseChainId.Bnb), address: '' }, [UniverseChainId.Mainnet]),
    ).toBe(undefined)
  })

  it('excludes an unknown chain id', () => {
    expect(getRestMultichainTokenEntry({ chainIdKey: '999999', address: '' }, [UniverseChainId.Mainnet])).toBe(
      undefined,
    )
  })
})
