import { findTrendingCategory } from 'uniswap/src/features/tokenCategories/findTrendingCategory'
import { TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'

describe(findTrendingCategory, () => {
  it('resolves the trending category by id regardless of its localized name', () => {
    const trending = tokenCategory({ id: 'trending', name: 'Tendencias', categoryClass: TokenCategoryClass.Market })
    const categories = [tokenCategory({ id: 'defi' }), trending]
    expect(findTrendingCategory(categories)).toBe(trending)
  })

  it('returns undefined for missing input', () => {
    expect(findTrendingCategory(undefined)).toBeUndefined()
    expect(findTrendingCategory([])).toBeUndefined()
  })
})
