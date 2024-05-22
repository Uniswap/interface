import { Currency } from '@uniswap/sdk-core'
import { filter } from 'wallet/src/components/TokenSelector/filter'
import { TokenOption } from 'wallet/src/components/TokenSelector/types'
import { ChainId } from 'wallet/src/constants/chains'
import { DAI, DAI_ARBITRUM_ONE } from 'wallet/src/constants/tokens'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { currencyId } from 'wallet/src/utils/currencyId'

const ETH = NativeCurrency.onChain(ChainId.Mainnet)

const TEST_TOKEN_INPUT: TokenOption[] = [
  {
    currencyInfo: {
      currency: DAI,
      currencyId: currencyId(DAI),
      logoUrl: null,
      safetyLevel: null,
    },
    balanceUSD: null,
    quantity: null,
  },
  {
    currencyInfo: {
      currency: ETH,
      currencyId: currencyId(ETH),
      logoUrl: null,
      safetyLevel: null,
    },
    balanceUSD: null,
    quantity: null,
  },
  {
    currencyInfo: {
      currency: DAI_ARBITRUM_ONE,
      currencyId: currencyId(DAI_ARBITRUM_ONE),
      logoUrl: null,
      safetyLevel: null,
    },
    balanceUSD: null,
    quantity: null,
  },
]

const filterAndGetCurrencies = (
  currencies: TokenOption[],
  chainFilter: ChainId | null,
  searchFilter?: string
): Currency[] => filter(currencies, chainFilter, searchFilter).map((cm) => cm.currencyInfo.currency)

describe(filter, () => {
  it('returns the entire input flattened if chainFilter and searchFilter are null', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null)).toEqual([DAI, ETH, DAI_ARBITRUM_ONE])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, '')).toEqual([DAI, ETH, DAI_ARBITRUM_ONE])
  })

  it('filters by single chain', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, ChainId.Mainnet)).toEqual([DAI, ETH])
  })

  it('filters by partial token symbol', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'D')).toEqual([DAI, DAI_ARBITRUM_ONE])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'DA')).toEqual([DAI, DAI_ARBITRUM_ONE])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'DAI')).toEqual([DAI, DAI_ARBITRUM_ONE])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'ETH')).toEqual([ETH])
  })

  it('filters by partial token name', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'th')).toEqual([ETH])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'stable')).toEqual([
      DAI,
      DAI_ARBITRUM_ONE,
    ])
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
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, ChainId.Mainnet, 'DA')).toEqual([DAI])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, ChainId.Mainnet, DAI.address)).toEqual([DAI])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, ChainId.ArbitrumOne, 'DAI')).toEqual([
      DAI_ARBITRUM_ONE,
    ])
    expect(
      filterAndGetCurrencies(TEST_TOKEN_INPUT, ChainId.ArbitrumOne, DAI_ARBITRUM_ONE.address)
    ).toEqual([DAI_ARBITRUM_ONE])
  })
})
