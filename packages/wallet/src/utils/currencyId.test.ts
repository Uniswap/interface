import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { DAI } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import {
  NATIVE_ANALYTICS_ADDRESS_VALUE,
  areCurrencyIdsEqual,
  buildCurrencyId,
  buildNativeCurrencyId,
  currencyAddress,
  currencyId,
  currencyIdToAddress,
  currencyIdToChain,
  currencyIdToGraphQLAddress,
  getCurrencyAddressForAnalytics,
  isNativeCurrencyAddress,
} from 'uniswap/src/utils/currencyId'

const ETH = NativeCurrency.onChain(UniverseChainId.Mainnet)
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

describe(currencyId, () => {
  it('builds correct ID for token', () => {
    expect(currencyId(DAI)).toEqual(`1-${DAI.address}`)
  })

  it('builds correct ID for native asset', () => {
    expect(currencyId(ETH)).toEqual(`${UniverseChainId.Mainnet}-${getNativeAddress(UniverseChainId.Mainnet)}`)
  })
})

describe(buildCurrencyId, () => {
  it('builds correct ID for token', () => {
    expect(buildCurrencyId(UniverseChainId.Mainnet, DAI.address)).toEqual(`${UniverseChainId.Mainnet}-${DAI.address}`)
  })
})

describe(areCurrencyIdsEqual, () => {
  it('returns correct comparison for the same currencyId', () => {
    expect(areCurrencyIdsEqual(currencyId(DAI), currencyId(DAI))).toBe(true)
  })

  it('returns correct comparison between a checksummed and lowercased currencyId', () => {
    expect(areCurrencyIdsEqual(currencyId(DAI), `${UniverseChainId.Mainnet}-${DAI.address.toLowerCase()}`)).toBe(true)
  })

  it('returns correct comparison for the different currencyIds', () => {
    expect(areCurrencyIdsEqual(currencyId(DAI), currencyId(ETH))).toBe(false)
  })
})

describe(currencyAddress, () => {
  it('returns correct address for native asset', () => {
    expect(currencyAddress(ETH)).toEqual(getNativeAddress(UniverseChainId.Mainnet))
  })

  it('returns correct address for token', () => {
    expect(currencyAddress(DAI)).toEqual(DAI.address)
  })
})

describe(getCurrencyAddressForAnalytics, () => {
  it('returns correct address for native asset', () => {
    expect(getCurrencyAddressForAnalytics(ETH)).toEqual(NATIVE_ANALYTICS_ADDRESS_VALUE)
  })

  it('returns correct address for token', () => {
    expect(getCurrencyAddressForAnalytics(DAI)).toEqual(DAI.address)
  })
})

describe(buildNativeCurrencyId, () => {
  it('builds correct ID for Mainnet', () => {
    expect(buildNativeCurrencyId(UniverseChainId.Mainnet)).toEqual(`1-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`)
  })

  it('builds correct ID for Polygon', () => {
    expect(buildNativeCurrencyId(UniverseChainId.Polygon)).toEqual(`137-0x0000000000000000000000000000000000001010`)
  })

  it('builds correct ID for BNB', () => {
    expect(buildNativeCurrencyId(UniverseChainId.Bnb)).toEqual(`56-0xb8c77482e45f1f44de1745f52c74426c631bdd52`)
  })
})

describe(isNativeCurrencyAddress, () => {
  it('returns true for native address', () => {
    expect(isNativeCurrencyAddress(UniverseChainId.Mainnet, getNativeAddress(UniverseChainId.Mainnet))).toEqual(true)
  })

  it('returns true for POL native address', () => {
    expect(isNativeCurrencyAddress(UniverseChainId.Polygon, getNativeAddress(UniverseChainId.Polygon))).toEqual(true)
  })

  it('returns true for null currency addresses', () => {
    expect(isNativeCurrencyAddress(UniverseChainId.Mainnet, null)).toEqual(true)
  })

  it('returns false for mainnet with Polygon native address', () => {
    expect(isNativeCurrencyAddress(UniverseChainId.Mainnet, getNativeAddress(UniverseChainId.Polygon))).toEqual(false)
  })

  it('returns false for token address', () => {
    expect(isNativeCurrencyAddress(UniverseChainId.Mainnet, DAI.address)).toEqual(false)
  })
})

describe(currencyIdToAddress, () => {
  it('returns correct address for token', () => {
    expect(currencyIdToAddress(`1-${DAI_ADDRESS}`)).toEqual(DAI_ADDRESS)
  })

  it('returns correct address for native asset', () => {
    expect(currencyIdToAddress(`1-${getNativeAddress(UniverseChainId.Mainnet)}`)).toEqual(
      getNativeAddress(UniverseChainId.Mainnet),
    )
  })
})

describe(currencyIdToGraphQLAddress, () => {
  it('returns correct address for token', () => {
    expect(currencyIdToGraphQLAddress(`1-${DAI_ADDRESS}`)).toEqual(DAI_ADDRESS.toLowerCase())
  })

  it('returns null for Mainnet native asset', () => {
    expect(currencyIdToGraphQLAddress(`1-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`)).toEqual(null)
  })

  it('returns POL address for Polygon native asset', () => {
    expect(currencyIdToGraphQLAddress('137-0x0000000000000000000000000000000000001010')).toEqual(
      '0x0000000000000000000000000000000000001010',
    )
  })

  it('returns null for BNB native asset', () => {
    expect(currencyIdToGraphQLAddress('56-0xB8c77482e45F1F44dE1745F52C74426C631bDD52')).toEqual(null)
  })
})

describe(currencyIdToChain, () => {
  it('returns correct chain for token', () => {
    expect(currencyIdToChain(`1-${DAI_ADDRESS}`)).toEqual(UniverseChainId.Mainnet)
  })

  it('returns correct chain for native asset', () => {
    expect(currencyIdToChain(`1-${getNativeAddress(UniverseChainId.Mainnet)}`)).toEqual(UniverseChainId.Mainnet)
  })

  it('handles invalid currencyId', () => {
    expect(currencyIdToChain('')).toEqual(null)
  })
})
