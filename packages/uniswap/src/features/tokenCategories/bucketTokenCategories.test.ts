import { bucketCategories } from 'uniswap/src/features/tokenCategories/bucketTokenCategories'
import { TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'

function makeCategory(id: string, categoryClass: TokenCategoryClass): TokenCategory {
  return {
    id,
    kind: 'token',
    name: id,
    englishName: id,
    description: '',
    categoryClass,
    grouped: false,
    topTokens: [],
    topGroups: [],
  }
}

describe('bucketTokenCategories', () => {
  it('buckets by class in Market/Asset/Sector order regardless of input order', () => {
    const buckets = bucketCategories([
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
    const buckets = bucketCategories([
      makeCategory('gaming', TokenCategoryClass.Sector),
      makeCategory('defi', TokenCategoryClass.Sector),
    ])
    expect(buckets[0]?.categories.map((category) => category.id)).toEqual(['gaming', 'defi'])
  })

  it('leads the Asset bucket with non-RWA assets, preserving the given order within each group', () => {
    const buckets = bucketCategories([
      makeCategory('stocks', TokenCategoryClass.Asset),
      makeCategory('stablecoins', TokenCategoryClass.Asset),
      makeCategory('commodities', TokenCategoryClass.Asset),
      makeCategory('majors', TokenCategoryClass.Asset),
    ])
    expect(buckets[0]?.categories.map((category) => category.id)).toEqual([
      'stablecoins',
      'majors',
      'stocks',
      'commodities',
    ])
  })

  it('omits empty buckets', () => {
    const buckets = bucketCategories([makeCategory('stocks', TokenCategoryClass.Asset)])
    expect(buckets).toHaveLength(1)
    expect(buckets[0]?.categoryClass).toBe(TokenCategoryClass.Asset)
  })

  it('returns no buckets for an empty list', () => {
    expect(bucketCategories([])).toEqual([])
  })
})
