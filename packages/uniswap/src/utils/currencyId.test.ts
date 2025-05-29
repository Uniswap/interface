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
  isCurrencyIdValid,
  isNativeCurrencyAddress,
} from 'uniswap/src/utils/currencyId'
import { INVALID_ADDRESS_TOO_SHORT, INVALID_CHAIN_ID, VALID_ADDRESS, VALID_CHAIN_ID } from 'utilities/src/test/fixtures'

const ETH = NativeCurrency.onChain(UniverseChainId.Mainnet)
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

describe('currencyId', () => {
  it.each`
    _currencyId                                           | expected
    ${`${VALID_CHAIN_ID}-${VALID_ADDRESS}`}               | ${true}
    ${`${VALID_CHAIN_ID}-${INVALID_ADDRESS_TOO_SHORT}`}   | ${false}
    ${`${INVALID_CHAIN_ID}-${VALID_ADDRESS}`}             | ${false}
    ${`${INVALID_CHAIN_ID}-${INVALID_ADDRESS_TOO_SHORT}`} | ${false}
    ${``}                                                 | ${false}
    ${undefined}                                          | ${false}
  `('currencyId=$currencyId should return expected=$expected', ({ _currencyId, expected }) => {
    expect(isCurrencyIdValid(_currencyId)).toEqual(expected)
  })
  it.each([
    [DAI, `1-${DAI.address}`],
    [ETH, `${UniverseChainId.Mainnet}-${getNativeAddress(UniverseChainId.Mainnet)}`],
  ])('builds correct ID for asset=$asset = $s', (asset, expectedId) => {
    expect(currencyId(asset)).toEqual(expectedId)
  })

  it.each([[UniverseChainId.Mainnet, DAI.address, `${UniverseChainId.Mainnet}-${DAI.address}`]])(
    'buildCurrencyId builds correct ID for chainId=%s + address=%s = %s',
    (chainId, address, expectedId) => {
      expect(buildCurrencyId(chainId, address)).toEqual(expectedId)
    },
  )

  it.each([
    [currencyId(DAI), currencyId(DAI), true],
    [currencyId(DAI), `${UniverseChainId.Mainnet}-${DAI.address.toLowerCase()}`, true],
    [currencyId(DAI), currencyId(ETH), false],
  ])(
    'areCurrencyIdsEqual returns correct comparison for currencyId1=%s and currencyId2=%s = %s',
    (currencyId1, currencyId2, expected) => {
      expect(areCurrencyIdsEqual(currencyId1, currencyId2)).toBe(expected)
    },
  )

  it.each([
    [ETH, getNativeAddress(UniverseChainId.Mainnet)],
    [DAI, DAI.address],
  ])('currencyAddress returns correct address for asset=%s = %s', (asset, expectedAddress) => {
    expect(currencyAddress(asset)).toEqual(expectedAddress)
  })

  it.each([
    [ETH, NATIVE_ANALYTICS_ADDRESS_VALUE],
    [DAI, DAI.address],
  ])('getCurrencyAddressForAnalytics returns correct address for asset=%s = %s', (asset, expectedAddress) => {
    expect(getCurrencyAddressForAnalytics(asset)).toEqual(expectedAddress)
  })

  it.each([
    [UniverseChainId.Mainnet, `1-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`],
    [UniverseChainId.Polygon, `137-0x0000000000000000000000000000000000001010`],
    [UniverseChainId.Bnb, `56-0xb8c77482e45f1f44de1745f52c74426c631bdd52`],
  ])('buildNativeCurrencyId builds correct ID for chainId=%s = %s', (chainId, expectedId) => {
    expect(buildNativeCurrencyId(chainId)).toEqual(expectedId)
  })

  it.each([
    [UniverseChainId.Mainnet, getNativeAddress(UniverseChainId.Mainnet), true],
    [UniverseChainId.Polygon, getNativeAddress(UniverseChainId.Polygon), true],
    [UniverseChainId.Mainnet, null, true],
    [UniverseChainId.Mainnet, getNativeAddress(UniverseChainId.Polygon), false],
    [UniverseChainId.Mainnet, DAI.address, false],
  ])(
    'isNativeCurrencyAddress returns correct result for chainId=%s + address=%s = %s',
    (chainId, address, expected) => {
      expect(isNativeCurrencyAddress(chainId, address)).toEqual(expected)
    },
  )

  it.each([
    [`1-${DAI_ADDRESS}`, DAI_ADDRESS],
    [`1-${getNativeAddress(UniverseChainId.Mainnet)}`, getNativeAddress(UniverseChainId.Mainnet)],
  ])('currencyIdToAddress returns correct address for _currencyId=%s = %s', (_currencyId, expectedAddress) => {
    expect(currencyIdToAddress(_currencyId)).toEqual(expectedAddress)
  })

  it.each([
    [`1-${DAI_ADDRESS}`, DAI_ADDRESS.toLowerCase()],
    [`1-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`, null],
    ['137-0x0000000000000000000000000000000000001010', '0x0000000000000000000000000000000000001010'],
    ['56-0xB8c77482e45F1F44dE1745F52C74426C631bDD52', null],
  ])('currencyIdToGraphQLAddress returns correct address for currencyId=%s = %s', (_currencyId, expectedAddress) => {
    expect(currencyIdToGraphQLAddress(_currencyId)).toEqual(expectedAddress)
  })

  it.each([
    [`1-${DAI_ADDRESS}`, UniverseChainId.Mainnet],
    [`1-${getNativeAddress(UniverseChainId.Mainnet)}`, UniverseChainId.Mainnet],
    ['', null],
  ])('currencyIdToChain returns correct chain for currencyId=%s = %s', (_currencyId, expectedChain) => {
    expect(currencyIdToChain(_currencyId)).toEqual(expectedChain)
  })
})
