import { toCategoryOptions } from 'uniswap/src/features/search/SearchModal/categories/toCategoryOptions'
import { type TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'

function makeCategory(id: string): TokenCategory {
  return { id, name: id, description: '', categoryClass: TokenCategoryClass.Sector, grouped: false, topTokens: [] }
}

const categories = [makeCategory('defi'), makeCategory('stablecoins'), makeCategory('gaming')]

describe('toCategoryOptions', () => {
  it('hydrates ids in response order, not ListCategories order', () => {
    const options = toCategoryOptions({ categoryIds: ['gaming', 'defi'], categories })
    expect(options.map((option) => option.category.id)).toEqual(['gaming', 'defi'])
  })

  it('drops ids unknown to ListCategories', () => {
    const options = toCategoryOptions({ categoryIds: ['defi', 'unknown'], categories })
    expect(options.map((option) => option.category.id)).toEqual(['defi'])
  })

  it('returns nothing without ids or without categories', () => {
    expect(toCategoryOptions({ categoryIds: undefined, categories })).toEqual([])
    expect(toCategoryOptions({ categoryIds: [], categories })).toEqual([])
    expect(toCategoryOptions({ categoryIds: ['defi'], categories: [] })).toEqual([])
  })
})
