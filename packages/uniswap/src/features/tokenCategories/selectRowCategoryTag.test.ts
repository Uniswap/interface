import { selectRowCategoryTag } from 'uniswap/src/features/tokenCategories/selectRowCategoryTag'
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

const stocks = makeCategory('stocks', TokenCategoryClass.Asset)
const trending = makeCategory('trending', TokenCategoryClass.Market)
const defi = makeCategory('defi', TokenCategoryClass.Sector)
const categories = [stocks, trending, defi]

describe('selectRowCategoryTag', () => {
  it('returns undefined for a token with no categories', () => {
    expect(selectRowCategoryTag({ categoryIds: undefined, categories })).toBeUndefined()
    expect(selectRowCategoryTag({ categoryIds: [], categories })).toBeUndefined()
  })

  it('follows categoryIds (BE) order, not the resolved categories order', () => {
    expect(selectRowCategoryTag({ categoryIds: ['defi', 'trending', 'stocks'], categories })).toBe(defi)
    expect(selectRowCategoryTag({ categoryIds: ['stocks', 'defi'], categories })).toBe(stocks)
  })

  it('skips ids that do not resolve to a known category', () => {
    expect(selectRowCategoryTag({ categoryIds: ['not-a-category', 'stocks'], categories })).toBe(stocks)
  })

  it('skips the scoped category and shows the next one instead', () => {
    expect(selectRowCategoryTag({ categoryIds: ['stocks', 'defi'], categories, skipCategoryId: 'stocks' })).toBe(defi)
    expect(selectRowCategoryTag({ categoryIds: ['stocks'], categories, skipCategoryId: 'stocks' })).toBeUndefined()
  })
})
