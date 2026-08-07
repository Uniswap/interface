import { GraphQLApi } from '@universe/api'
import { getMultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/getMultichainTokenEntry'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { describe, expect, it } from 'vitest'

describe(getMultichainTokenEntry, () => {
  it('normalizes a null native address to the canonical native entry', () => {
    expect(getMultichainTokenEntry({ chain: GraphQLApi.Chain.Bnb, address: null }, [UniverseChainId.Bnb])).toEqual({
      chainId: UniverseChainId.Bnb,
      address: getNativeAddress(UniverseChainId.Bnb),
      isNative: true,
    })
  })

  it('normalizes an explicit native address to the canonical native entry', () => {
    expect(
      getMultichainTokenEntry(
        {
          chain: GraphQLApi.Chain.Bnb,
          address: getNativeAddress(UniverseChainId.Bnb),
        },
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

    expect(getMultichainTokenEntry({ chain: GraphQLApi.Chain.Ethereum, address }, [UniverseChainId.Mainnet])).toEqual({
      chainId: UniverseChainId.Mainnet,
      address,
      isNative: false,
    })
  })

  it('excludes a feature-gated chain', () => {
    expect(getMultichainTokenEntry({ chain: GraphQLApi.Chain.Bnb, address: null }, [UniverseChainId.Mainnet])).toBe(
      undefined,
    )
  })

  it('excludes an unsupported GraphQL chain', () => {
    expect(getMultichainTokenEntry({ chain: 'UNKNOWN_CHAIN', address: null }, [UniverseChainId.Mainnet])).toBe(
      undefined,
    )
  })
})
