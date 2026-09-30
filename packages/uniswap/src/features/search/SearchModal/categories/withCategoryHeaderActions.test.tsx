import { OnchainItemListOptionType, type SearchModalListOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { withCategoryHeaderActions } from 'uniswap/src/features/search/SearchModal/categories/withCategoryHeaderActions'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'

const trending = tokenCategory({ id: 'trending', name: 'Trending' })

const trendingSection: OnchainItemSection<SearchModalListOption> = {
  sectionKey: OnchainItemSectionName.Category,
  categoryId: 'trending',
  name: 'Trending',
  data: [],
}
const recentSection: OnchainItemSection<SearchModalListOption> = {
  sectionKey: OnchainItemSectionName.RecentSearches,
  data: [],
}

describe('withCategoryHeaderActions', () => {
  it('leaves sections without a resolved category untouched', () => {
    const openCategoryDetails = vi.fn()
    const [recent, unknown] = withCategoryHeaderActions({
      sections: [recentSection, { ...trendingSection, categoryId: 'unknown' }],
      categories: [trending],
      openCategoryDetails,
    })
    expect(recent).toBe(recentSection)
    expect(unknown?.onPress).toBeUndefined()
    expect(unknown?.rightElement).toBeUndefined()
  })

  it('gives a category header a press action and info icon that report the header selection', () => {
    const openCategoryDetails = vi.fn()
    const [, section] = withCategoryHeaderActions({
      sections: [recentSection, trendingSection],
      categories: [trending],
      openCategoryDetails,
    })

    section?.onPress?.()

    expect(section?.rightElement).toBeDefined()
    expect(openCategoryDetails).toHaveBeenCalledWith({
      item: { type: OnchainItemListOptionType.Category, category: trending },
      section: trendingSection,
      index: -1,
      rowIndex: 1,
    })
  })
})
