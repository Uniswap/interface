import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { describe, expect, it } from 'vitest'
import {
  exploreCategoryToRankedRwaCategory,
  isRankedRwaExploreCategory,
  isRwaExploreCategory,
} from '~/pages/Explore/categories/exploreRwaCategory'
import { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'

describe('exploreCategoryToRankedRwaCategory', () => {
  it('maps ranked explore categories to data-api rwa categories', () => {
    expect(exploreCategoryToRankedRwaCategory(ExploreCategory.Stocks)).toBe(RwaCategory.STOCKS)
    expect(exploreCategoryToRankedRwaCategory(ExploreCategory.Etfs)).toBe(RwaCategory.ETFS)
  })
})

describe('isRwaExploreCategory', () => {
  it('identifies stocks, commodities, and etfs as rwa categories', () => {
    expect(isRwaExploreCategory(ExploreCategory.Stocks)).toBe(true)
    expect(isRwaExploreCategory(ExploreCategory.Commodities)).toBe(true)
    expect(isRwaExploreCategory(ExploreCategory.Etfs)).toBe(true)
    expect(isRwaExploreCategory(ExploreCategory.Popular)).toBe(false)
  })
})

describe('isRankedRwaExploreCategory', () => {
  it('identifies stocks and etfs as ranked categories', () => {
    expect(isRankedRwaExploreCategory(ExploreCategory.Stocks)).toBe(true)
    expect(isRankedRwaExploreCategory(ExploreCategory.Etfs)).toBe(true)
    expect(isRankedRwaExploreCategory(ExploreCategory.Commodities)).toBe(false)
    expect(isRankedRwaExploreCategory(ExploreCategory.Popular)).toBe(false)
  })
})
