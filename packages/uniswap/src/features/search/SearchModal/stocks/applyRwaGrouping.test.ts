import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  OnchainItemListOptionType,
  type MultichainTokenOption,
  type SearchModalOption,
  type TokenOption,
} from 'uniswap/src/components/lists/items/types'
import { applyRwaGroupingToSearchOptions } from 'uniswap/src/features/search/SearchModal/stocks/applyRwaGrouping'
import { buildRwaSearchIndex } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'

const MAINNET = 1
const BNB = 56
const index = buildRwaSearchIndex([
  {
    symbol: 'TSLA',
    name: 'Tesla',
    logoUrl: '',
    categories: [RwaCategory.STOCKS],
    issuerTokens: [
      { chainId: MAINNET, address: '0xa', issuer: 'ondo' },
      { chainId: BNB, address: '0xb', issuer: 'ondo' },
      { chainId: MAINNET, address: '0xc', issuer: 'xstocks' },
    ],
    issuerData: {
      ondo: { name: 'Ondo', symbol: 'TSLAON', logoUrl: '' },
      xstocks: { name: 'xStocks', symbol: 'TSLAX', logoUrl: '' },
    },
  },
])

function token(chainId: number, address: string, symbol = 'X'): TokenOption {
  return {
    type: OnchainItemListOptionType.Token,
    currencyInfo: {
      currencyId: `${chainId}-${address}`,
      currency: { chainId, address, isNative: false, symbol },
    } as never,
    quantity: null,
    balanceUSD: undefined,
  }
}

describe('applyRwaGroupingToSearchOptions', () => {
  it('collapses a matched multi-issuer ticker into one collection hoisted above generic tokens', () => {
    const generic = token(MAINNET, '0xother', 'PEPE')
    const out = applyRwaGroupingToSearchOptions({
      options: [generic, token(MAINNET, '0xa', 'TSLAON')],
      index,
      isAddressSearch: false,
      chainFilter: null,
    })
    expect(out[0]?.type).toBe(OnchainItemListOptionType.RwaCollection)
    expect(out[1]).toBe(generic)
    expect(out).toHaveLength(2)
  })

  it('dedupes multiple issuer tokens of the same ticker into one collection', () => {
    const out = applyRwaGroupingToSearchOptions({
      options: [token(MAINNET, '0xa', 'TSLAON'), token(MAINNET, '0xc', 'TSLAX')],
      index,
      isAddressSearch: false,
      chainFilter: null,
    })
    expect(out.filter((o) => o.type === OnchainItemListOptionType.RwaCollection)).toHaveLength(1)
    expect(out).toHaveLength(1)
  })

  it('direct-CA search keeps the single matched token tagged with clean name + issuer slug, no collection', () => {
    const out = applyRwaGroupingToSearchOptions({
      options: [token(MAINNET, '0xa', 'TSLAON')],
      index,
      isAddressSearch: true,
      chainFilter: null,
    })
    expect(out[0]?.type).toBe(OnchainItemListOptionType.Token)
    expect((out[0] as TokenOption).rwaCategory).toBe(RwaCategory.STOCKS)
    expect((out[0] as TokenOption).rwaName).toBe('Tesla')
    expect((out[0] as TokenOption).rwaIssuerSlug).toBe('ondo')
  })

  it('network filter demotes to a single tagged token when only one issuer is on-chain', () => {
    const out = applyRwaGroupingToSearchOptions({
      options: [token(BNB, '0xb', 'TSLAON')],
      index,
      isAddressSearch: false,
      chainFilter: BNB as never,
    })
    // only ondo is on BNB -> single issuer on-chain -> tagged token, not a collection
    expect(out[0]?.type).toBe(OnchainItemListOptionType.Token)
    expect((out[0] as TokenOption).rwaCategory).toBe(RwaCategory.STOCKS)
    expect((out[0] as TokenOption).rwaName).toBe('Tesla')
    expect((out[0] as TokenOption).rwaIssuerSlug).toBe('ondo')
  })

  it('threads a non-STOCKS category from the matched asset onto the tagged token', () => {
    const etfsIndex = buildRwaSearchIndex([
      {
        symbol: 'IVV',
        name: 'iShares S&P 500 ETF',
        logoUrl: '',
        categories: [RwaCategory.ETFS],
        issuerTokens: [{ chainId: MAINNET, address: '0xetf', issuer: 'blackrock' }],
        issuerData: { blackrock: { name: 'BlackRock', symbol: 'IVV', logoUrl: '' } },
      },
    ])
    const out = applyRwaGroupingToSearchOptions({
      options: [token(MAINNET, '0xetf', 'IVV')],
      index: etfsIndex,
      isAddressSearch: true,
      chainFilter: null,
    })
    expect(out[0]?.type).toBe(OnchainItemListOptionType.Token)
    expect((out[0] as TokenOption).rwaCategory).toBe(RwaCategory.ETFS)
  })

  it('matches a MultichainTokenOption via any of its chain tokens', () => {
    const multi: MultichainTokenOption = {
      type: OnchainItemListOptionType.MultichainToken,
      multichainResult: {
        id: 'm',
        name: 'Tesla',
        symbol: 'TSLA',
        logoUrl: null,
        tokens: [{ currency: { chainId: MAINNET, address: '0xa', isNative: false } }] as never,
      },
      primaryCurrencyInfo: {
        currencyId: '1-0xa',
        currency: { chainId: MAINNET, address: '0xa', isNative: false },
      } as never,
    }
    const out = applyRwaGroupingToSearchOptions({ options: [multi], index, isAddressSearch: false, chainFilter: null })
    expect(out[0]?.type).toBe(OnchainItemListOptionType.RwaCollection)
  })
})
