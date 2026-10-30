import { findCategoryBySlug } from 'uniswap/src/features/tokenCategories/categorySlug'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'

const CATEGORIES = [tokenCategory({ id: 'stocks', name: 'Stocks' }), tokenCategory({ id: 'defi' })]

describe(findCategoryBySlug, () => {
  it('resolves a slug case-insensitively', () => {
    const category = findCategoryBySlug({ categories: CATEGORIES, slug: 'Stocks' })
    expect(category?.name).toBe('Stocks')
  })

  it('returns undefined for unknown or missing slugs', () => {
    expect(findCategoryBySlug({ categories: CATEGORIES, slug: 'not-a-category' })).toBeUndefined()
    expect(findCategoryBySlug({ categories: CATEGORIES, slug: undefined })).toBeUndefined()
  })
})
