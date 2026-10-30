import type { TFunction } from 'i18next'
import { Briefcase } from 'ui/src/components/icons/Briefcase'
import { Ranking } from 'ui/src/components/icons/Ranking'
import { SwapCoin } from 'ui/src/components/icons/SwapCoin'
import { Tag } from 'ui/src/components/icons/Tag'
import { type Category, TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { describe, expect, it } from 'vitest'
import {
  deriveCategoryChipOptions,
  getStaticCategoryChipOptions,
} from '~/pages/Explore/categories/exploreCategoryChipOptions'
import { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'

const t = ((key: string) => key) as TFunction
const noneEmpty = (): boolean => false

function makeCategory(id: string, name: string): TokenCategory {
  return {
    id,
    name,
    englishName: name,
    description: '',
    kind: 'token',
    categoryClass: TokenCategoryClass.Sector,
    grouped: false,
    topTokens: [],
    topGroups: [],
  }
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
    const options = deriveCategoryChipOptions({ kind: 'token', categories: CATEGORIES, isCategoryEmpty: noneEmpty, t })
    expect(options.map((option) => option.id)).toEqual([
      ExploreCategory.All,
      'trending',
      'recently-launched',
      'stocks',
      'defi',
    ])
  })

  it('keeps the spotlit row unchanged when a spotlit category is selected', () => {
    const options = deriveCategoryChipOptions({
      kind: 'token',
      categories: CATEGORIES,
      selectedCategoryId: 'stocks',
      isCategoryEmpty: noneEmpty,
      t,
    })
    expect(options).toHaveLength(5)
  })

  it('replaces the last spotlit slot with a non-spotlit selection, keeping the chip count constant', () => {
    const options = deriveCategoryChipOptions({
      kind: 'token',
      categories: CATEGORIES,
      selectedCategoryId: 'majors',
      isCategoryEmpty: noneEmpty,
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

  it('keeps the persisted flex slot after moving back to a spotlit selection', () => {
    const options = deriveCategoryChipOptions({
      kind: 'token',
      categories: CATEGORIES,
      selectedCategoryId: 'trending',
      flexSlotCategoryId: 'majors',
      isCategoryEmpty: noneEmpty,
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
      kind: 'token',
      categories: CATEGORIES,
      selectedCategoryId: 'commodities',
      flexSlotCategoryId: 'majors',
      isCategoryEmpty: noneEmpty,
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
      kind: 'token',
      categories: CATEGORIES,
      selectedCategoryId: 'defi',
      flexSlotCategoryId: 'majors',
      isCategoryEmpty: noneEmpty,
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
      kind: 'token',
      categories: [makeCategory('trending', 'Trending'), makeCategory('stocks', 'Stocks')],
      selectedCategoryId: 'etfs',
      isCategoryEmpty: noneEmpty,
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
      kind: 'token',
      categories: CATEGORIES,
      selectedCategoryId: 'trending',
      flexSlotCategoryId: 'stocks',
      isCategoryEmpty: noneEmpty,
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
    const options = deriveCategoryChipOptions({
      kind: 'token',
      categories: CATEGORIES,
      selectedCategoryId: 'unknown',
      isCategoryEmpty: noneEmpty,
      t,
    })
    expect(options).toHaveLength(5)
  })

  it('never falls back to the static token chips for a pool row', () => {
    const options = deriveCategoryChipOptions({
      kind: 'pool',
      categories: [],
      selectedCategoryId: 'stocks',
      isCategoryEmpty: noneEmpty,
      t,
    })
    expect(options.map((option) => option.id)).toEqual(['all'])
  })

  it('slots in the static chip when a valid static selection is missing from the response', () => {
    const options = deriveCategoryChipOptions({
      kind: 'token',
      categories: CATEGORIES.filter((category) => category.id !== 'stocks'),
      selectedCategoryId: 'stocks',
      isCategoryEmpty: noneEmpty,
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

  describe('with empty categories', () => {
    const emptyIds = new Set(['recently-launched', 'defi'])
    const isCategoryEmpty = (category: Category): boolean => emptyIds.has(category.id)

    it('skips empty categories and backfills the spotlit row from the rest of the order', () => {
      const options = deriveCategoryChipOptions({ kind: 'token', categories: CATEGORIES, isCategoryEmpty, t })
      expect(options.map((option) => option.id)).toEqual([
        ExploreCategory.All,
        'trending',
        'stocks',
        'commodities',
        'majors',
      ])
    })

    it('shows only the non-empty categories when fewer than four have tokens', () => {
      const options = deriveCategoryChipOptions({
        kind: 'token',
        categories: CATEGORIES,
        isCategoryEmpty: (category) => category.id !== 'stocks',
        t,
      })
      expect(options.map((option) => option.id)).toEqual([ExploreCategory.All, 'stocks'])
    })

    it('shows only All when every category is empty', () => {
      const options = deriveCategoryChipOptions({
        kind: 'token',
        categories: CATEGORIES,
        isCategoryEmpty: () => true,
        t,
      })
      expect(options.map((option) => option.id)).toEqual([ExploreCategory.All])
    })

    it('gives a selected empty category the flex slot so a deep link keeps its active chip', () => {
      const options = deriveCategoryChipOptions({
        kind: 'token',
        categories: CATEGORIES,
        selectedCategoryId: 'defi',
        isCategoryEmpty,
        t,
      })
      expect(options.map((option) => option.id)).toEqual([
        ExploreCategory.All,
        'trending',
        'stocks',
        'commodities',
        'defi',
      ])
    })

    it('appends a selected empty category when every category is empty', () => {
      const options = deriveCategoryChipOptions({
        kind: 'token',
        categories: CATEGORIES,
        selectedCategoryId: 'defi',
        isCategoryEmpty: () => true,
        t,
      })
      expect(options.map((option) => option.id)).toEqual([ExploreCategory.All, 'defi'])
    })

    it('drops a persisted flex slot id that is empty once it is no longer selected', () => {
      const options = deriveCategoryChipOptions({
        kind: 'token',
        categories: CATEGORIES,
        selectedCategoryId: 'trending',
        flexSlotCategoryId: 'defi',
        isCategoryEmpty,
        t,
      })
      expect(options.map((option) => option.id)).toEqual([
        ExploreCategory.All,
        'trending',
        'stocks',
        'commodities',
        'majors',
      ])
    })
  })

  it('labels dynamic chips with the category name from the response', () => {
    const options = deriveCategoryChipOptions({ kind: 'token', categories: CATEGORIES, isCategoryEmpty: noneEmpty, t })
    expect(options[2]?.label).toBe('New')
  })

  it('carries the fetched category on dynamic chips only, not on All or static fallbacks', () => {
    const options = deriveCategoryChipOptions({
      kind: 'token',
      categories: CATEGORIES.filter((category) => category.id !== 'stocks'),
      selectedCategoryId: 'stocks',
      isCategoryEmpty: noneEmpty,
      t,
    })
    expect(options[1]?.category).toBe(CATEGORIES[0])
    expect(options[0]?.category).toBeUndefined()
    expect(options[4]?.category).toBeUndefined()
    expect(getStaticCategoryChipOptions(t).every((option) => option.category === undefined)).toBe(true)
  })

  it('resolves icons by category id and falls back to the tag icon for unmapped categories', () => {
    const options = deriveCategoryChipOptions({ kind: 'token', categories: CATEGORIES, isCategoryEmpty: noneEmpty, t })
    expect(options[0]?.icon).toBe(Ranking)
    expect(options[3]?.icon).toBe(Briefcase)
    expect(options[4]?.icon).toBe(SwapCoin)

    const [, unmapped] = deriveCategoryChipOptions({
      kind: 'token',
      categories: [makeCategory('unmapped', 'Unmapped')],
      isCategoryEmpty: noneEmpty,
      t,
    })
    expect(unmapped.icon).toBe(Tag)
  })
})
