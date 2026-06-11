import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  OnchainItemListOptionType,
  type RwaTokenOption,
  type TokenOption,
  type TokenSelectorListOption,
} from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { tagRwaTokenSelectorSections } from 'uniswap/src/components/TokenSelector/tagRwaTokenSelectorSections'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  buildRwaSearchIndex,
  type RwaSearchIndex,
} from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'

const MAINNET = UniverseChainId.Mainnet

const index = buildRwaSearchIndex([
  {
    symbol: 'TSLA',
    name: 'Tesla',
    logoUrl: '',
    categories: [RwaCategory.STOCKS],
    issuerTokens: [{ chainId: MAINNET, address: '0xa', issuer: 'ondo' }],
    issuerData: { ondo: { name: 'Ondo', symbol: 'TSLAON', logoUrl: '' } },
  },
])
// An ETF asset, to prove a non-STOCKS category threads through to the row.
const etfsIndex = buildRwaSearchIndex([
  {
    symbol: 'IVV',
    name: 'iShares S&P 500 ETF',
    logoUrl: '',
    categories: [RwaCategory.ETFS],
    issuerTokens: [{ chainId: MAINNET, address: '0xb', issuer: 'blackrock' }],
    issuerData: { blackrock: { name: 'BlackRock', symbol: 'IVV', logoUrl: '' } },
  },
])
// A matched asset with no classified category — renders no tag.
const uncategorizedIndex = buildRwaSearchIndex([
  {
    symbol: 'RWA1',
    name: 'Unclassified RWA',
    logoUrl: '',
    issuerTokens: [{ chainId: MAINNET, address: '0xc', issuer: 'issuer' }],
    issuerData: { issuer: { name: 'Issuer', symbol: 'RWA1', logoUrl: '' } },
  },
])
const EMPTY_INDEX: RwaSearchIndex = { rwas: [], byChainAddress: new Map() }

function token(chainId: number, address: string, symbol = 'X', quantity: number | null = null): TokenOption {
  return {
    type: OnchainItemListOptionType.Token,
    currencyInfo: {
      currencyId: `${chainId}-${address}`,
      currency: { chainId, address, isNative: false, symbol },
    } as never,
    quantity,
    balanceUSD: undefined,
  }
}

function nativeToken(chainId: number): TokenOption {
  return {
    type: OnchainItemListOptionType.Token,
    currencyInfo: {
      currencyId: `${chainId}-native`,
      currency: { chainId, isNative: true, symbol: 'ETH' },
    } as never,
    quantity: null,
    balanceUSD: undefined,
  }
}

function section(data: TokenSelectorListOption[]): OnchainItemSection<TokenSelectorListOption> {
  return { data, sectionKey: OnchainItemSectionName.SearchResults }
}

const rwaArrayRow: RwaTokenOption[] = [
  { type: OnchainItemListOptionType.Rwa, chainId: MAINNET, address: '0xa', symbol: 'TSLAON', name: 'Tesla' },
]

describe('tagRwaTokenSelectorSections', () => {
  it('tags a matching single token row with its category', () => {
    const out = tagRwaTokenSelectorSections({ sections: [section([token(MAINNET, '0xa', 'TSLAON')])], rwaIndex: index })
    expect((out?.[0]?.data[0] as TokenOption).rwaCategory).toBe(RwaCategory.STOCKS)
  })

  it('threads a non-STOCKS category from the index through to the row', () => {
    const out = tagRwaTokenSelectorSections({
      sections: [section([token(MAINNET, '0xb', 'IVV')])],
      rwaIndex: etfsIndex,
    })
    expect((out?.[0]?.data[0] as TokenOption).rwaCategory).toBe(RwaCategory.ETFS)
  })

  it('marks a matched RWA with no classified category as UNSPECIFIED (no tag)', () => {
    const out = tagRwaTokenSelectorSections({
      sections: [section([token(MAINNET, '0xc', 'RWA1')])],
      rwaIndex: uncategorizedIndex,
    })
    expect((out?.[0]?.data[0] as TokenOption).rwaCategory).toBe(RwaCategory.UNSPECIFIED)
  })

  it('tags a matching token even when it has a balance (balance-override is the component, not the transform)', () => {
    const out = tagRwaTokenSelectorSections({
      sections: [section([token(MAINNET, '0xa', 'TSLAON', 5)])],
      rwaIndex: index,
    })
    expect((out?.[0]?.data[0] as TokenOption).rwaCategory).toBe(RwaCategory.STOCKS)
  })

  it('leaves a non-matching token untouched (same reference, no category)', () => {
    const generic = token(MAINNET, '0xother', 'PEPE')
    const out = tagRwaTokenSelectorSections({ sections: [section([generic])], rwaIndex: index })
    expect(out?.[0]?.data[0]).toBe(generic)
    expect((out?.[0]?.data[0] as TokenOption).rwaCategory).toBeUndefined()
  })

  it('tags only the matching single row in a section that also contains an array row', () => {
    const generic = token(MAINNET, '0xother', 'PEPE')
    const out = tagRwaTokenSelectorSections({
      sections: [section([token(MAINNET, '0xa', 'TSLAON'), rwaArrayRow, generic])],
      rwaIndex: index,
    })
    expect((out?.[0]?.data[0] as TokenOption).rwaCategory).toBe(RwaCategory.STOCKS)
    expect(out?.[0]?.data[1]).toBe(rwaArrayRow) // array row untouched by reference
    expect(out?.[0]?.data[2]).toBe(generic) // non-match untouched by reference
  })

  it('leaves array rows (token pills / stocks shelf) untouched by reference', () => {
    const out = tagRwaTokenSelectorSections({ sections: [section([rwaArrayRow])], rwaIndex: index })
    expect(out?.[0]?.data[0]).toBe(rwaArrayRow)
  })

  it('does not tag or throw on a native token', () => {
    const native = nativeToken(MAINNET)
    const out = tagRwaTokenSelectorSections({ sections: [section([native])], rwaIndex: index })
    expect((out?.[0]?.data[0] as TokenOption).rwaCategory).toBeUndefined()
  })

  it('returns the same sections reference when a non-empty index matches nothing', () => {
    const sections = [section([token(MAINNET, '0xother', 'PEPE')])]
    expect(tagRwaTokenSelectorSections({ sections, rwaIndex: index })).toBe(sections)
  })

  it('is a pass-through (same reference) when the index is empty', () => {
    const sections = [section([token(MAINNET, '0xa', 'TSLAON')])]
    expect(tagRwaTokenSelectorSections({ sections, rwaIndex: EMPTY_INDEX })).toBe(sections)
  })

  it('returns undefined sections unchanged', () => {
    expect(tagRwaTokenSelectorSections({ sections: undefined, rwaIndex: index })).toBeUndefined()
  })
})
