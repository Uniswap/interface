import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { describe, expect, it } from 'vitest'
import {
  exploreCategoryToRankedRwaCategory,
  isRankedRwaExploreCategory,
  isRwaExploreCategory,
} from '~/pages/Explore/categories/exploreRwaCategory'

describe('exploreCategoryToRankedRwaCategory', () => {
  it('maps ranked explore categories to data-api rwa categories', () => {
    expect(exploreCategoryToRankedRwaCategory('stocks')).toBe(RwaCategory.STOCKS)
    expect(exploreCategoryToRankedRwaCategory('etfs')).toBe(RwaCategory.ETFS)
  })
})

describe('isRwaExploreCategory', () => {
  it('identifies stocks, commodities, and etfs as rwa categories', () => {
    expect(isRwaExploreCategory('stocks')).toBe(true)
    expect(isRwaExploreCategory('commodities')).toBe(true)
    expect(isRwaExploreCategory('etfs')).toBe(true)
    expect(isRwaExploreCategory('popular')).toBe(false)
  })
})

describe('isRankedRwaExploreCategory', () => {
  it('identifies stocks and etfs as ranked categories', () => {
    expect(isRankedRwaExploreCategory('stocks')).toBe(true)
    expect(isRankedRwaExploreCategory('etfs')).toBe(true)
    expect(isRankedRwaExploreCategory('commodities')).toBe(false)
    expect(isRankedRwaExploreCategory('popular')).toBe(false)
  })
})
