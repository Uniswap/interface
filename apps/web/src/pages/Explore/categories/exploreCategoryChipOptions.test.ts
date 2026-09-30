import type { TFunction } from 'i18next'
import { Briefcase } from 'ui/src/components/icons/Briefcase'
import { Ranking } from 'ui/src/components/icons/Ranking'
import { Tag } from 'ui/src/components/icons/Tag'
import { TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { describe, expect, it } from 'vitest'
import {
  deriveCategoryChipOptions,
  getStaticCategoryChipOptions,
} from '~/pages/Explore/categories/exploreCategoryChipOptions'
import { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'

const t = ((key: string) => key) as TFunction

function makeCategory(id: string, name: string): TokenCategory {
  return { id, name, description: '', categoryClass: TokenCategoryClass.Sector, grouped: false, topTokens: [] }
}

const CATEGORIES = [
  makeCategory('trending', 'Trending'),
  makeCategory('recently-launched', 'New'),
  makeCategory('stocks', 'Stocks'),
  makeCategory('defi', 'DeFi'),
  makeCategory('commodities', 'Commodities'),
  makeCategory('majors', 'Majors'),
]

describe('getStaticCategoryChipOptions', () => {
  it('returns the pre-token-categories chip set', () => {
    expect(getStaticCategoryChipOptions(t).map((option) => option.id)).toEqual([
      ExploreCategory.All,
      ExploreCategory.Stocks,
      ExploreCategory.Commodities,
      ExploreCategory.Etfs,
    ])
  })
})

describe('deriveCategoryChipOptions', () => {
  it('spotlights All plus the first four categories in the given order', () => {
    const options = deriveCategoryChipOptions({ categories: CATEGORIES, t })
    expect(options.map((option) => option.id)).toEqual([
      ExploreCategory.All,
      'trending',
      'recently-launched',
      'stocks',
      'defi',
    ])
  })

  it('keeps the spotlit row unchanged when a spotlit category is selected', () => {
    const options = deriveCategoryChipOptions({ categories: CATEGORIES, selectedCategoryId: 'stocks', t })
    expect(options).toHaveLength(5)
  })

  it('replaces the last spotlit slot with a non-spotlit selection, keeping the chip count constant', () => {
    const options = deriveCategoryChipOptions({ categories: CATEGORIES, selectedCategoryId: 'majors', t })
    expect(options.map((option) => option.id)).toEqual([
      ExploreCategory.All,
      'trending',
      'recently-launched',
      'stocks',
      'majors',
    ])
  })

  it('keeps the persisted flex slot after moving back to a spotlit selection', () => {
    const options = deriveCategoryChipOptions({
      categories: CATEGORIES,
      selectedCategoryId: 'trending',
      flexSlotCategoryId: 'majors',
      t,
    })
    expect(options.map((option) => option.id)).toEqual([
      ExploreCategory.All,
      'trending',
      'recently-launched',
      'stocks',
      'majors',
    ])
  })

  it('cedes the flex slot to a new non-spotlit selection over the persisted one', () => {
    const options = deriveCategoryChipOptions({
      categories: CATEGORIES,
      selectedCategoryId: 'commodities',
      flexSlotCategoryId: 'majors',
      t,
    })
    expect(options.map((option) => option.id)).toEqual([
      ExploreCategory.All,
      'trending',
      'recently-launched',
      'stocks',
      'commodities',
    ])
  })

  it('keeps the selected chip when the selection holds the last spotlit slot and a flex slot id is persisted', () => {
    const options = deriveCategoryChipOptions({
      categories: CATEGORIES,
      selectedCategoryId: 'defi',
      flexSlotCategoryId: 'majors',
      t,
    })
    expect(options.map((option) => option.id)).toEqual([
      ExploreCategory.All,
      'trending',
      'recently-launched',
      'stocks',
      'defi',
    ])
  })

  it('appends a non-spotlit selection when the row has open slots', () => {
    const options = deriveCategoryChipOptions({
      categories: [makeCategory('trending', 'Trending'), makeCategory('stocks', 'Stocks')],
      selectedCategoryId: 'etfs',
      t,
    })
    expect(options.map((option) => option.id)).toEqual([
      ExploreCategory.All,
      'trending',
      'stocks',
      ExploreCategory.Etfs,
    ])
  })

  it('ignores a persisted flex slot id that is already spotlit', () => {
    const options = deriveCategoryChipOptions({
      categories: CATEGORIES,
      selectedCategoryId: 'trending',
      flexSlotCategoryId: 'stocks',
      t,
    })
    expect(options.map((option) => option.id)).toEqual([
      ExploreCategory.All,
      'trending',
      'recently-launched',
      'stocks',
      'defi',
    ])
  })

  it('ignores a selection that is not a fetched category', () => {
    const options = deriveCategoryChipOptions({ categories: CATEGORIES, selectedCategoryId: 'unknown', t })
    expect(options).toHaveLength(5)
  })

  it('slots in the static chip when a valid static selection is missing from the response', () => {
    const options = deriveCategoryChipOptions({
      categories: CATEGORIES.filter((category) => category.id !== 'stocks'),
      selectedCategoryId: 'stocks',
      t,
    })
    expect(options.map((option) => option.id)).toEqual([
      ExploreCategory.All,
      'trending',
      'recently-launched',
      'defi',
      ExploreCategory.Stocks,
    ])
    expect(options[4]?.icon).toBe(Briefcase)
  })

  it('labels dynamic chips with the category name from the response', () => {
    const options = deriveCategoryChipOptions({ categories: CATEGORIES, t })
    expect(options[2]?.label).toBe('New')
  })

  it('carries the fetched category on dynamic chips only, not on All or static fallbacks', () => {
    const options = deriveCategoryChipOptions({
      categories: CATEGORIES.filter((category) => category.id !== 'stocks'),
      selectedCategoryId: 'stocks',
      t,
    })
    expect(options[1]?.category).toBe(CATEGORIES[0])
    expect(options[0]?.category).toBeUndefined()
    expect(options[4]?.category).toBeUndefined()
    expect(getStaticCategoryChipOptions(t).every((option) => option.category === undefined)).toBe(true)
  })

  it('resolves icons by category id and falls back to the tag icon for unmapped categories', () => {
    const options = deriveCategoryChipOptions({ categories: CATEGORIES, t })
    expect(options[0]?.icon).toBe(Ranking)
    expect(options[3]?.icon).toBe(Briefcase)
    expect(options[4]?.icon).toBe(Tag)
  })
})
