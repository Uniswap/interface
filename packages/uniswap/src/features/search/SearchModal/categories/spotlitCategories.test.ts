import {
  getSpotlitCategorySectionId,
  resolveSpotlitCategories,
} from 'uniswap/src/features/search/SearchModal/categories/spotlitCategories'
import { TokenCategoryClass, type TokenCategory } from 'uniswap/src/features/tokenCategories/types'

function category(id: string): TokenCategory {
  return { id, name: id, description: '', categoryClass: TokenCategoryClass.Market, grouped: false, topTokens: [] }
}

const categories = [category('stocks'), category('trending'), category('top-gainers')]

describe('resolveSpotlitCategories', () => {
  it('keeps config order rather than backend order', () => {
    expect(
      resolveSpotlitCategories({ spotlitCategoryIds: ['top-gainers', 'stocks'], categories }).map((c) => c.id),
    ).toEqual(['top-gainers', 'stocks'])
  })

  it('drops unknown and duplicate ids', () => {
    expect(
      resolveSpotlitCategories({
        spotlitCategoryIds: ['trending', 'unknown', 'trending', 'stocks'],
        categories,
      }).map((c) => c.id),
    ).toEqual(['trending', 'stocks'])
  })

  it('returns nothing when the config is empty', () => {
    expect(resolveSpotlitCategories({ spotlitCategoryIds: [], categories })).toEqual([])
  })
})

describe('getSpotlitCategorySectionId', () => {
  it('namespaces by category id', () => {
    expect(getSpotlitCategorySectionId('stocks')).toBe('category-stocks')
  })
})
