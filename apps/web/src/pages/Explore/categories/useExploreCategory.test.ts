import { describe, expect, it } from 'vitest'
import {
  categoryFromParam,
  getExploreStocksTableURL,
  getExploreTokensURL,
} from '~/pages/Explore/categories/useExploreCategory'

describe('categoryFromParam', () => {
  it('defaults to popular', () => {
    expect(categoryFromParam(null)).toBe('popular')
  })

  it('maps rwa category params', () => {
    expect(categoryFromParam('stocks')).toBe('stocks')
    expect(categoryFromParam('commodities')).toBe('commodities')
    expect(categoryFromParam('etfs')).toBe('etfs')
  })

  it('maps unknown category values to popular', () => {
    expect(categoryFromParam('unknown')).toBe('popular')
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
