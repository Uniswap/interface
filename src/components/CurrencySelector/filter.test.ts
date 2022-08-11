import { filter } from 'src/components/CurrencySelector/filter'
import { CurrencyWithMetadata } from 'src/components/CurrencySelector/types'
import { ChainId } from 'src/constants/chains'
import { DAI, DAI_ARBITRUM_ONE } from 'src/constants/tokens'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'

const ETH = NativeCurrency.onChain(ChainId.Mainnet)

const TEST_TOKEN_INPUT: CurrencyWithMetadata[] = [
  {
    currency: DAI,
    currencyAmount: null,
    balanceUSD: null,
  },
  {
    currency: ETH,
    currencyAmount: null,
    balanceUSD: null,
  },
  {
    currency: DAI_ARBITRUM_ONE,
    currencyAmount: null,
    balanceUSD: null,
  },
]

const filterAndGetCurrencies = (
  currencies: CurrencyWithMetadata[],
  chainFilter: ChainId | null,
  searchFilter: string | null
) =>
  filter(currencies, chainFilter, searchFilter)
    .map((r) => r.item)
    .map((cm) => cm.currency)

describe(filter, () => {
  it('returns the entire input flattened if chainFilter and searchFilter are null', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, null)).toEqual([
      DAI,
      ETH,
      DAI_ARBITRUM_ONE,
    ])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, '')).toEqual([DAI, ETH, DAI_ARBITRUM_ONE])
  })

  it('filters by single chain', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, ChainId.Mainnet, null)).toEqual([DAI, ETH])
  })

  it('filters by partial token symbol', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'D')).toEqual([DAI, DAI_ARBITRUM_ONE])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'DA')).toEqual([DAI, DAI_ARBITRUM_ONE])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'DAI')).toEqual([DAI, DAI_ARBITRUM_ONE])
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'ETH')).toEqual([ETH])
  })

  it('fuzzy matches on symbol', () => {
    expect(filterAndGetCurrencies(TEST_TOKEN_INPUT, null, 'DAI2')).toEqual([DAI, DAI_ARBITRUM_ONE])
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
