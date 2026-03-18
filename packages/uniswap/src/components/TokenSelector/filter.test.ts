import { Currency } from '@uniswap/sdk-core'
import { OnchainItemListOptionType, TokenOption } from 'uniswap/src/components/lists/items/types'
import { filter } from 'uniswap/src/components/TokenSelector/filter'
import { DAI, DAI_ARBITRUM_ONE, nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { currencyId } from 'uniswap/src/utils/currencyId'

const ETH = nativeOnChain(UniverseChainId.Mainnet)

const TEST_TOKEN_INPUT: TokenOption[] = [
  {
    type: OnchainItemListOptionType.Token,
    currencyInfo: {
      currency: DAI,
      currencyId: currencyId(DAI),
      logoUrl: null,
      safetyInfo: null,
    },
    balanceUSD: null,
    quantity: null,
  },
  {
    type: OnchainItemListOptionType.Token,
    currencyInfo: {
      currency: ETH,
      currencyId: currencyId(ETH),
      logoUrl: null,
      safetyInfo: null,
    },
    balanceUSD: null,
    quantity: null,
  },
  {
    type: OnchainItemListOptionType.Token,
    currencyInfo: {
      currency: DAI_ARBITRUM_ONE,
      currencyId: currencyId(DAI_ARBITRUM_ONE),
      logoUrl: null,
      safetyInfo: null,
    },
    balanceUSD: null,
    quantity: null,
  },
]

const filterAndGetCurrencies = (
  currencies: TokenOption[],
  chainFilter: UniverseChainId | null,
  searchFilter?: string,
  // eslint-disable-next-line max-params
): Currency[] => filter({ tokenOptions: currencies, chainFilter, searchFilter }).map((cm) => cm.currencyInfo.currency)

describe(filter, () => {
  it('returns the entire input flattened if chainFilter and searchFilter are null', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null)).toEqual([DAI, ETH, DAI_ARBITRUM_ONE])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, '')).toEqual([DAI, ETH, DAI_ARBITRUM_ONE])
  })

  it('filters by single chain', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, UniverseChainId.Mainnet)).toEqual([DAI, ETH])
  })

  it('filters by partial token symbol', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'D')).toEqual([DAI, DAI_ARBITRUM_ONE])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'DA')).toEqual([DAI, DAI_ARBITRUM_ONE])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'DAI')).toEqual([DAI, DAI_ARBITRUM_ONE])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'ETH')).toEqual([ETH])
  })

  it('filters by partial token name', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'th')).toEqual([ETH])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'stable')).toEqual([DAI, DAI_ARBITRUM_ONE])
  })

  it('filters by first characters of token address', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, DAI.address)).toEqual([DAI])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, DAI.address.slice(0, 10))).toEqual([DAI])
  })

  it('ignores matching addresses when not starting with 0x or fewer than 5 characters', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, '0x')).toEqual([])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, DAI.address.slice(4, 10))).toEqual([])
  })

  it('ignores non-first characters of token address', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, DAI.address.slice(3, 6))).toEqual([])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, DAI.address.slice(10, -1))).toEqual([])
  })

  it('filters by chainFilter and searchFilter', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, UniverseChainId.Mainnet, 'DA')).toEqual([DAI])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, UniverseChainId.Mainnet, DAI.address)).toEqual([DAI])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, UniverseChainId.ArbitrumOne, 'DAI')).toEqual([DAI_ARBITRUM_ONE])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, UniverseChainId.ArbitrumOne, DAI_ARBITRUM_ONE.address)).toEqual([
      DAI_ARBITRUM_ONE,
    ])
  })
})
