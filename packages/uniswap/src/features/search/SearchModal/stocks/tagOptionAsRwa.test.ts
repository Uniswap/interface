import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  OnchainItemListOptionType,
  type MultichainTokenOption,
  type TokenOption,
} from 'uniswap/src/components/lists/items/types'
import { buildRwaSearchIndex, findRwaForToken } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'
import { tagOptionAsRwa } from 'uniswap/src/features/search/SearchModal/stocks/tagOptionAsRwa'

const MAINNET = 1
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

function token(chainId: number, address: string): TokenOption {
  return {
    type: OnchainItemListOptionType.Token,
    currencyInfo: {
      currencyId: `${chainId}-${address}`,
      currency: { chainId, address, isNative: false, symbol: 'TSLAON' },
    } as never,
    quantity: null,
    balanceUSD: undefined,
  }
}

function multichainToken(chainId: number, address: string): MultichainTokenOption {
  return {
    type: OnchainItemListOptionType.MultichainToken,
    multichainResult: {
      id: 'm',
      name: 'Tesla',
      symbol: 'TSLA',
      logoUrl: null,
      tokens: [{ currency: { chainId, address, isNative: false } }],
    } as never,
    primaryCurrencyInfo: {
      currencyId: `${chainId}-${address}`,
      currency: { chainId, address, isNative: false, symbol: 'TSLAON' },
    } as never,
  }
}

describe('tagOptionAsRwa', () => {
  it('stamps category, clean name, and issuer slug from the match', () => {
    const match = findRwaForToken(index, { chainId: MAINNET, address: '0xa' })
    if (!match) {
      throw new Error('fixture match missing')
    }
    const out = tagOptionAsRwa({ option: token(MAINNET, '0xa'), match })
    expect(out.rwaCategory).toBe(RwaCategory.STOCKS)
    expect(out.rwaName).toBe('Tesla')
    expect(out.rwaIssuerSlug).toBe('ondo')
  })

  it('preserves the original option fields and produces a new object', () => {
    const match = findRwaForToken(index, { chainId: MAINNET, address: '0xa' })
    if (!match) {
      throw new Error('fixture match missing')
    }
    const option = token(MAINNET, '0xa')
    const out = tagOptionAsRwa({ option, match })
    expect(out).not.toBe(option)
    expect(out.type).toBe(OnchainItemListOptionType.Token)
    expect(out.currencyInfo).toBe(option.currencyInfo)
  })

  it('is generic over the MultichainTokenOption shape (stamps fields, preserves type + multichainResult)', () => {
    const match = findRwaForToken(index, { chainId: MAINNET, address: '0xa' })
    if (!match) {
      throw new Error('fixture match missing')
    }
    const option = multichainToken(MAINNET, '0xa')
    const out = tagOptionAsRwa({ option, match })
    expect(out.type).toBe(OnchainItemListOptionType.MultichainToken)
    expect(out.multichainResult).toBe(option.multichainResult)
    expect(out.rwaCategory).toBe(RwaCategory.STOCKS)
    expect(out.rwaName).toBe('Tesla')
    expect(out.rwaIssuerSlug).toBe('ondo')
  })

  it('coalesces an empty asset name / issuer slug to undefined (so the title falls back, not blanks)', () => {
    const emptyIndex = buildRwaSearchIndex([
      {
        symbol: 'TSLA',
        name: '', // proto3 scalar default — must not blank the row title
        logoUrl: '',
        categories: [RwaCategory.STOCKS],
        issuerTokens: [{ chainId: MAINNET, address: '0xa', issuer: '' }],
        issuerData: {},
      },
    ])
    const match = findRwaForToken(emptyIndex, { chainId: MAINNET, address: '0xa' })
    if (!match) {
      throw new Error('fixture match missing')
    }
    const out = tagOptionAsRwa({ option: token(MAINNET, '0xa'), match })
    expect(out.rwaName).toBeUndefined()
    expect(out.rwaIssuerSlug).toBeUndefined()
  })
})
