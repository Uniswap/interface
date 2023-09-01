import { NATIVE_ADDRESS, NATIVE_ADDRESS_ALT } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { DAI } from 'wallet/src/constants/tokens'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import {
  areCurrencyIdsEqual,
  buildCurrencyId,
  buildNativeCurrencyId,
  currencyAddress,
  currencyAddressForSwapQuote,
  currencyId,
  currencyIdToAddress,
  currencyIdToChain,
  currencyIdToGraphQLAddress,
  getCurrencyAddressForAnalytics,
  getNativeCurrencyAddressForChain,
  isNativeCurrencyAddress,
  NATIVE_ANALYTICS_ADDRESS_VALUE,
  SwapRouterNativeAssets,
} from './currencyId'

const ETH = NativeCurrency.onChain(ChainId.Mainnet)
const MATIC = NativeCurrency.onChain(ChainId.Polygon)
const BNB = NativeCurrency.onChain(ChainId.Bnb)
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

describe(currencyId, () => {
  it('builds correct ID for token', () => {
    expect(currencyId(DAI)).toEqual(`1-${DAI.address}`)
  })

  it('builds correct ID for native asset', () => {
    expect(currencyId(ETH)).toEqual(`${ChainId.Mainnet}-${NATIVE_ADDRESS}`)
  })
})

describe(buildCurrencyId, () => {
  it('builds correct ID for token', () => {
    expect(buildCurrencyId(ChainId.Mainnet, DAI.address)).toEqual(
      `${ChainId.Mainnet}-${DAI.address}`
    )
  })
})

describe(buildNativeCurrencyId, () => {
  it('builds correct ID for native asset', () => {
    expect(buildNativeCurrencyId(ChainId.Mainnet)).toEqual(`${ChainId.Mainnet}-${NATIVE_ADDRESS}`)
  })
})

describe(areCurrencyIdsEqual, () => {
  it('returns correct comparison for the same currencyId', () => {
    expect(areCurrencyIdsEqual(currencyId(DAI), currencyId(DAI))).toBe(true)
  })

  it('returns correct comparison between a checksummed and lowercased currencyId', () => {
    expect(
      areCurrencyIdsEqual(currencyId(DAI), `${ChainId.Mainnet}-${DAI.address.toLowerCase()}`)
    ).toBe(true)
  })

  it('returns correct comparison for the different currencyIds', () => {
    expect(areCurrencyIdsEqual(currencyId(DAI), currencyId(ETH))).toBe(false)
  })
})

describe(currencyAddressForSwapQuote, () => {
  it('returns correct address for native, non-polygon asset', () => {
    expect(currencyAddressForSwapQuote(ETH)).toEqual(SwapRouterNativeAssets.ETH)
  })

  it('returns correct address for native polygon asset', () => {
    expect(currencyAddressForSwapQuote(MATIC)).toEqual(SwapRouterNativeAssets.MATIC)
  })

  it('returns correct address for native bnb asset', () => {
    expect(currencyAddressForSwapQuote(BNB)).toEqual(SwapRouterNativeAssets.BNB)
  })

  it('returns correct address for token', () => {
    expect(currencyAddressForSwapQuote(DAI)).toEqual(DAI.address)
  })
})

describe(currencyAddress, () => {
  it('returns correct address for native asset', () => {
    expect(currencyAddress(ETH)).toEqual(NATIVE_ADDRESS)
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

describe(getNativeCurrencyAddressForChain, () => {
  it('returns correct address for mainnet', () => {
    expect(getNativeCurrencyAddressForChain(ChainId.Mainnet)).toEqual(NATIVE_ADDRESS)
  })

  it('returns correct address for polygon', () => {
    expect(getNativeCurrencyAddressForChain(ChainId.Polygon)).toEqual(NATIVE_ADDRESS_ALT)
  })
})

describe(isNativeCurrencyAddress, () => {
  it('returns true for native address', () => {
    expect(isNativeCurrencyAddress(ChainId.Mainnet, NATIVE_ADDRESS)).toEqual(true)
  })

  it('returns true for matic native address', () => {
    expect(isNativeCurrencyAddress(ChainId.Polygon, NATIVE_ADDRESS_ALT)).toEqual(true)
  })

  it('returns true for null currency addresses', () => {
    expect(isNativeCurrencyAddress(ChainId.Mainnet, null)).toEqual(true)
  })

  it('returns false for mainnet with mative native address', () => {
    expect(isNativeCurrencyAddress(ChainId.Mainnet, NATIVE_ADDRESS_ALT)).toEqual(false)
  })

  it('returns false for token address', () => {
    expect(isNativeCurrencyAddress(ChainId.Mainnet, DAI.address)).toEqual(false)
  })
})

describe(currencyIdToAddress, () => {
  it('returns correct address for token', () => {
    expect(currencyIdToAddress(`1-${DAI_ADDRESS}`)).toEqual(DAI_ADDRESS)
  })

  it('returns correct address for native asset', () => {
    expect(currencyIdToAddress(`1-${NATIVE_ADDRESS}`)).toEqual(NATIVE_ADDRESS)
  })
})

describe(currencyIdToGraphQLAddress, () => {
  it('returns correct address for token', () => {
    expect(currencyIdToGraphQLAddress(`1-${DAI_ADDRESS}`)).toEqual(DAI_ADDRESS.toLowerCase())
  })

  it('returns null for native asset', () => {
    expect(currencyIdToGraphQLAddress(`1-${NATIVE_ADDRESS}`)).toEqual(null)
  })
})

describe(currencyIdToChain, () => {
  it('returns correct chain for token', () => {
    expect(currencyIdToChain(`1-${DAI_ADDRESS}`)).toEqual(ChainId.Mainnet)
  })

  it('returns correct chain for native asset', () => {
    expect(currencyIdToChain(`1-${NATIVE_ADDRESS}`)).toEqual(ChainId.Mainnet)
  })

  it('handles invalid currencyId', () => {
    expect(currencyIdToChain(undefined)).toEqual(null)
  })
})
