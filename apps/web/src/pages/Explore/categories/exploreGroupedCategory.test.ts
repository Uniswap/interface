import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { describe, expect, it } from 'vitest'
import {
  resolveGroupedRwaCategory,
  resolveRwaDisclaimerCategory,
  showsRwaDisclaimer,
  showsVolumeTimeFrameSelector,
} from '~/pages/Explore/categories/exploreGroupedCategory'

function makeCategory(id: string, categoryClass: TokenCategoryClass, grouped = false): TokenCategory {
  return { id, name: id, description: '', categoryClass, grouped, topTokens: [] }
}

const CATEGORIES = [
  makeCategory('stocks', TokenCategoryClass.Asset, true),
  makeCategory('etfs', TokenCategoryClass.Asset, true),
  makeCategory('commodities', TokenCategoryClass.Asset),
  makeCategory('stablecoins', TokenCategoryClass.Asset),
  makeCategory('trending', TokenCategoryClass.Market),
  makeCategory('defi', TokenCategoryClass.Sector),
]

describe('resolveGroupedRwaCategory', () => {
  it('maps fetched BE-grouped categories to their grouped RwaCategory', () => {
    expect(resolveGroupedRwaCategory({ categoryId: 'stocks', categories: CATEGORIES })).toBe(RwaCategory.STOCKS)
    expect(resolveGroupedRwaCategory({ categoryId: 'etfs', categories: CATEGORIES })).toBe(RwaCategory.ETFS)
  })

  it('renders a fetched flat category flat even when it has an RWA mapping (Commodities)', () => {
    expect(resolveGroupedRwaCategory({ categoryId: 'commodities', categories: CATEGORIES })).toBe(
      RwaCategory.UNSPECIFIED,
    )
  })

  it('resolves fetched categories without RWA data to UNSPECIFIED (flat table), asset class included', () => {
    expect(resolveGroupedRwaCategory({ categoryId: 'stablecoins', categories: CATEGORIES })).toBe(
      RwaCategory.UNSPECIFIED,
    )
    expect(resolveGroupedRwaCategory({ categoryId: 'trending', categories: CATEGORIES })).toBe(RwaCategory.UNSPECIFIED)
    expect(resolveGroupedRwaCategory({ categoryId: 'defi', categories: CATEGORIES })).toBe(RwaCategory.UNSPECIFIED)
  })

  it('falls back to the static grouped set when the category is not in the fetched list', () => {
    expect(resolveGroupedRwaCategory({ categoryId: 'stocks', categories: [] })).toBe(RwaCategory.STOCKS)
    expect(resolveGroupedRwaCategory({ categoryId: 'etfs', categories: [] })).toBe(RwaCategory.ETFS)
    expect(resolveGroupedRwaCategory({ categoryId: 'commodities', categories: [] })).toBe(RwaCategory.COMMODITIES)
  })

  it('resolves Commodities flat while the first fetch is pending, so the table does not flip once it lands', () => {
    expect(resolveGroupedRwaCategory({ categoryId: 'commodities', categories: [], categoriesPending: true })).toBe(
      RwaCategory.UNSPECIFIED,
    )
    expect(resolveGroupedRwaCategory({ categoryId: 'stocks', categories: [], categoriesPending: true })).toBe(
      RwaCategory.STOCKS,
    )
    expect(resolveGroupedRwaCategory({ categoryId: 'etfs', categories: [], categoriesPending: true })).toBe(
      RwaCategory.ETFS,
    )
  })

  it('resolves unknown and default ids to UNSPECIFIED', () => {
    expect(resolveGroupedRwaCategory({ categoryId: 'all', categories: [] })).toBe(RwaCategory.UNSPECIFIED)
    expect(resolveGroupedRwaCategory({ categoryId: 'all', categories: CATEGORIES })).toBe(RwaCategory.UNSPECIFIED)
    expect(resolveGroupedRwaCategory({ categoryId: 'gaming', categories: [] })).toBe(RwaCategory.UNSPECIFIED)
  })
})

describe('resolveRwaDisclaimerCategory', () => {
  it('keys the disclaimer on the category id alone', () => {
    expect(resolveRwaDisclaimerCategory('stocks')).toBe(RwaCategory.STOCKS)
    expect(resolveRwaDisclaimerCategory('etfs')).toBe(RwaCategory.ETFS)
    expect(resolveRwaDisclaimerCategory('commodities')).toBe(RwaCategory.COMMODITIES)
    expect(resolveRwaDisclaimerCategory('defi')).toBe(RwaCategory.UNSPECIFIED)
  })
})

describe('showsRwaDisclaimer', () => {
  it('shows the disclaimer for stocks and etfs only', () => {
    expect(showsRwaDisclaimer(RwaCategory.STOCKS)).toBe(true)
    expect(showsRwaDisclaimer(RwaCategory.ETFS)).toBe(true)
    expect(showsRwaDisclaimer(RwaCategory.COMMODITIES)).toBe(false)
    expect(showsRwaDisclaimer(RwaCategory.UNSPECIFIED)).toBe(false)
  })
})

describe('showsVolumeTimeFrameSelector', () => {
  it('always shows for flat categories', () => {
    expect(showsVolumeTimeFrameSelector({ rwaCategory: RwaCategory.UNSPECIFIED, tokenCategoriesEnabled: false })).toBe(
      true,
    )
  })

  it('shows for grouped categories only when token categories are on', () => {
    expect(showsVolumeTimeFrameSelector({ rwaCategory: RwaCategory.STOCKS, tokenCategoriesEnabled: false })).toBe(false)
    expect(showsVolumeTimeFrameSelector({ rwaCategory: RwaCategory.STOCKS, tokenCategoriesEnabled: true })).toBe(true)
    expect(showsVolumeTimeFrameSelector({ rwaCategory: RwaCategory.COMMODITIES, tokenCategoriesEnabled: true })).toBe(
      true,
    )
  })
})
