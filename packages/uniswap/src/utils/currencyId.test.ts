import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { DAI, nativeOnChain } from 'uniswap/src/constants/tokens'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import { DEFAULT_NATIVE_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
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
  NATIVE_ANALYTICS_ADDRESS_VALUE,
} from 'uniswap/src/utils/currencyId'
import { INVALID_ADDRESS_TOO_SHORT, INVALID_CHAIN_ID, VALID_ADDRESS, VALID_CHAIN_ID } from 'utilities/src/test/fixtures'

const ETH = nativeOnChain(UniverseChainId.Mainnet)

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
    // eslint-disable-next-line max-params
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
    // eslint-disable-next-line max-params
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
    [UniverseChainId.Bnb, `56-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`],
  ])('buildNativeCurrencyId builds correct ID for chainId=%s = %s', (chainId, expectedId) => {
    expect(buildNativeCurrencyId(chainId)).toEqual(expectedId)
  })

  it.each([
    [UniverseChainId.Mainnet, getNativeAddress(UniverseChainId.Mainnet), true],
    [UniverseChainId.Polygon, getNativeAddress(UniverseChainId.Polygon), true],
    [UniverseChainId.Mainnet, null, true],
    [UniverseChainId.Mainnet, getNativeAddress(UniverseChainId.Polygon), false],
    [UniverseChainId.Mainnet, DAI.address, false],
    [UniverseChainId.Mainnet, 'ETH', true],
    [UniverseChainId.Mainnet, DEFAULT_NATIVE_ADDRESS, true],
    [UniverseChainId.Solana, getNativeAddress(UniverseChainId.Solana), true],
    [UniverseChainId.Solana, '11111', false],
    [UniverseChainId.Solana, DEFAULT_NATIVE_ADDRESS_SOLANA, true],
  ])(
    'isNativeCurrencyAddress returns correct result for chainId=%s + address=%s = %s',
    // eslint-disable-next-line max-params
    (chainId, address, expected) => {
      expect(isNativeCurrencyAddress(chainId, address)).toEqual(expected)
    },
  )

  it.each([
    [`1-${DAI.address}`, DAI.address],
    [`1-${getNativeAddress(UniverseChainId.Mainnet)}`, getNativeAddress(UniverseChainId.Mainnet)],
  ])('currencyIdToAddress returns correct address for _currencyId=%s = %s', (_currencyId, expectedAddress) => {
    expect(currencyIdToAddress(_currencyId)).toEqual(expectedAddress)
  })

  it.each([
    [`1-${DAI.address}`, DAI.address.toLowerCase()],
    [`1-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`, null],
    ['137-0x0000000000000000000000000000000000001010', '0x0000000000000000000000000000000000001010'],
    ['56-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', null],
  ])('currencyIdToGraphQLAddress returns correct address for currencyId=%s = %s', (_currencyId, expectedAddress) => {
    expect(currencyIdToGraphQLAddress(_currencyId)).toEqual(expectedAddress)
  })

  it.each([
    [`1-${DAI.address}`, UniverseChainId.Mainnet],
    [`1-${getNativeAddress(UniverseChainId.Mainnet)}`, UniverseChainId.Mainnet],
    ['', null],
  ])('currencyIdToChain returns correct chain for currencyId=%s = %s', (_currencyId, expectedChain) => {
    expect(currencyIdToChain(_currencyId)).toEqual(expectedChain)
  })
})
