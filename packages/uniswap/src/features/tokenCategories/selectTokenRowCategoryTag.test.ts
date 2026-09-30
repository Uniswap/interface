import { selectTokenRowCategoryTag } from 'uniswap/src/features/tokenCategories/selectTokenRowCategoryTag'
import { TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'

function makeCategory(id: string, categoryClass: TokenCategoryClass): TokenCategory {
  return { id, name: id, description: '', categoryClass, grouped: false, topTokens: [] }
}

const stocks = makeCategory('stocks', TokenCategoryClass.Asset)
const trending = makeCategory('trending', TokenCategoryClass.Market)
const defi = makeCategory('defi', TokenCategoryClass.Sector)
const categories = [stocks, trending, defi]

describe('selectTokenRowCategoryTag', () => {
  it('returns undefined for a token with no categories', () => {
    expect(selectTokenRowCategoryTag({ categoryIds: undefined, categories })).toBeUndefined()
    expect(selectTokenRowCategoryTag({ categoryIds: [], categories, scopedCategoryId: 'defi' })).toBeUndefined()
  })

  it('follows categoryIds (BE) order, not the resolved categories order', () => {
    expect(selectTokenRowCategoryTag({ categoryIds: ['defi', 'trending', 'stocks'], categories })).toBe(defi)
    expect(selectTokenRowCategoryTag({ categoryIds: ['stocks', 'defi'], categories })).toBe(stocks)
  })

  it('drops the in-scope category and falls through to the next one', () => {
    expect(selectTokenRowCategoryTag({ categoryIds: ['defi', 'trending'], categories, scopedCategoryId: 'defi' })).toBe(
      trending,
    )
  })

  it('skips ids that do not resolve to a known category', () => {
    expect(selectTokenRowCategoryTag({ categoryIds: ['not-a-category', 'stocks'], categories })).toBe(stocks)
  })

  it('returns undefined when the in-scope category is the token’s only one', () => {
    expect(selectTokenRowCategoryTag({ categoryIds: ['defi'], categories, scopedCategoryId: 'defi' })).toBeUndefined()
  })
})
