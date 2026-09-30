import { findTokenCategoryBySlug } from 'uniswap/src/features/tokenCategories/categorySlug'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'

const CATEGORIES = [tokenCategory({ id: 'stocks', name: 'Stocks' }), tokenCategory({ id: 'defi' })]

describe(findTokenCategoryBySlug, () => {
  it('resolves a slug case-insensitively', () => {
    const category = findTokenCategoryBySlug({ categories: CATEGORIES, slug: 'Stocks' })
    expect(category?.name).toBe('Stocks')
  })

  it('returns undefined for unknown or missing slugs', () => {
    expect(findTokenCategoryBySlug({ categories: CATEGORIES, slug: 'not-a-category' })).toBeUndefined()
    expect(findTokenCategoryBySlug({ categories: CATEGORIES, slug: undefined })).toBeUndefined()
  })
})
