import {
  createCategoryDetailsNavState,
  parseCategoryDetailsNavState,
} from '~/pages/Explore/CategoryDetails/categoryDetailsEntryPoint'

const TDP_PATHNAME = '/explore/tokens/ethereum/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
const TDP_SEARCH = '?chain=base'

describe('createCategoryDetailsNavState', () => {
  beforeEach(() => {
    window.history.pushState({}, '', `${TDP_PATHNAME}${TDP_SEARCH}`)
  })

  it('points back at the current token details URL, search included, labeled with the ticker', () => {
    expect(createCategoryDetailsNavState({ tokenSymbol: 'WBTC' })).toEqual({
      from: `${TDP_PATHNAME}${TDP_SEARCH}`,
      fromLabel: 'WBTC',
    })
  })

  it('follows a URL rewritten outside the router, as the TDP chain switch does', () => {
    const switchedPathname = '/explore/tokens/base/0x0555e30da8f98308edb960aa94c0db47230d2b9c'
    window.history.replaceState(window.history.state, '', switchedPathname)

    expect(createCategoryDetailsNavState({ tokenSymbol: 'WBTC' })).toEqual({
      from: switchedPathname,
      fromLabel: 'WBTC',
    })
  })

  it('returns nothing while the ticker is unknown', () => {
    expect(createCategoryDetailsNavState({ tokenSymbol: undefined })).toBeUndefined()
  })
})

describe('parseCategoryDetailsNavState', () => {
  it('accepts an in-app token details entry with a label', () => {
    const state = { from: `${TDP_PATHNAME}${TDP_SEARCH}`, fromLabel: 'WBTC' }
    expect(parseCategoryDetailsNavState(state)).toEqual(state)
  })

  it('drops extra fields from the state', () => {
    expect(parseCategoryDetailsNavState({ from: TDP_PATHNAME, fromLabel: 'WBTC', extra: true })).toEqual({
      from: TDP_PATHNAME,
      fromLabel: 'WBTC',
    })
  })

  it.each([
    ['undefined state', undefined],
    ['a non-object state', 'from'],
    ['a missing from', { fromLabel: 'WBTC' }],
    ['a non-string from', { from: 1, fromLabel: 'WBTC' }],
    ['a missing label', { from: TDP_PATHNAME }],
    ['an empty label', { from: TDP_PATHNAME, fromLabel: '' }],
    ['a non token details path', { from: '/explore/pools/ethereum/0x1', fromLabel: 'WBTC' }],
    ['an external URL', { from: 'https://evil.com/explore/tokens/x', fromLabel: 'WBTC' }],
    ['a protocol-relative path', { from: '//evil.com/explore/tokens/x', fromLabel: 'WBTC' }],
    ['a path traversal', { from: '/explore/tokens/../../swap', fromLabel: 'WBTC' }],
    ['a bare token details prefix', { from: '/explore/tokens/', fromLabel: 'WBTC' }],
  ])('rejects %s', (_, state) => {
    expect(parseCategoryDetailsNavState(state)).toBeUndefined()
  })
})
