import { bucketTokenCategories } from 'uniswap/src/features/tokenCategories/bucketTokenCategories'
import { TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'

function makeCategory(id: string, categoryClass: TokenCategoryClass): TokenCategory {
  return { id, name: id, description: '', categoryClass, grouped: false, topTokens: [] }
}

describe('bucketTokenCategories', () => {
  it('buckets by class in Market/Asset/Sector order regardless of input order', () => {
    const buckets = bucketTokenCategories([
      makeCategory('defi', TokenCategoryClass.Sector),
      makeCategory('stocks', TokenCategoryClass.Asset),
      makeCategory('trending', TokenCategoryClass.Market),
    ])
    expect(buckets.map((bucket) => bucket.categoryClass)).toEqual([
      TokenCategoryClass.Market,
      TokenCategoryClass.Asset,
      TokenCategoryClass.Sector,
    ])
  })

  it('preserves the given order within a bucket', () => {
    const buckets = bucketTokenCategories([
      makeCategory('gaming', TokenCategoryClass.Sector),
      makeCategory('defi', TokenCategoryClass.Sector),
    ])
    expect(buckets[0]?.categories.map((category) => category.id)).toEqual(['gaming', 'defi'])
  })

  it('omits empty buckets', () => {
    const buckets = bucketTokenCategories([makeCategory('stocks', TokenCategoryClass.Asset)])
    expect(buckets).toHaveLength(1)
    expect(buckets[0]?.categoryClass).toBe(TokenCategoryClass.Asset)
  })

  it('returns no buckets for an empty list', () => {
    expect(bucketTokenCategories([])).toEqual([])
  })
})
