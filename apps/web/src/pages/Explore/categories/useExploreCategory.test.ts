import { describe, expect, it } from 'vitest'
import {
  categoryFromParam,
  ExploreCategory,
  getExploreStocksTableURL,
  getExploreTokensURL,
} from '~/pages/Explore/categories/useExploreCategory'

describe('categoryFromParam', () => {
  it('defaults to popular', () => {
    expect(categoryFromParam(null)).toBe(ExploreCategory.Popular)
  })

  it('maps rwa category params', () => {
    expect(categoryFromParam('stocks')).toBe(ExploreCategory.Stocks)
    expect(categoryFromParam('commodities')).toBe(ExploreCategory.Commodities)
    expect(categoryFromParam('etfs')).toBe(ExploreCategory.Etfs)
  })

  it('maps unknown category values to popular', () => {
    expect(categoryFromParam('unknown')).toBe(ExploreCategory.Popular)
  })
})

describe('getExploreTokensURL', () => {
  it('returns explore tokens URL without a category param', () => {
    expect(getExploreTokensURL()).toBe('/explore/tokens')
  })
})

describe('getExploreStocksTableURL', () => {
  it('returns explore tokens URL with stocks category param', () => {
    expect(getExploreStocksTableURL()).toBe('/explore/tokens?category=stocks')
  })
})
