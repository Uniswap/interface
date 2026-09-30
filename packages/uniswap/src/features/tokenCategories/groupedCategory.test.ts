import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  getGroupedRwaCategory,
  resetGroupedCategoryWarnings,
} from 'uniswap/src/features/tokenCategories/groupedCategory'
import { type TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { logger } from 'utilities/src/logger/logger'

function makeCategory(id: string, grouped: boolean): TokenCategory {
  return { id, name: id, description: '', categoryClass: TokenCategoryClass.Asset, grouped, topTokens: [] }
}

describe('getGroupedRwaCategory', () => {
  beforeEach(() => {
    resetGroupedCategoryWarnings()
  })

  it('maps BE-grouped stocks and etfs to their grouped RwaCategory', () => {
    expect(getGroupedRwaCategory(makeCategory('stocks', true))).toBe(RwaCategory.STOCKS)
    expect(getGroupedRwaCategory(makeCategory('etfs', true))).toBe(RwaCategory.ETFS)
  })

  it('renders a category flat when the BE says so, even if it has an RWA mapping', () => {
    expect(getGroupedRwaCategory(makeCategory('commodities', false))).toBe(RwaCategory.UNSPECIFIED)
    expect(getGroupedRwaCategory(makeCategory('stocks', false))).toBe(RwaCategory.UNSPECIFIED)
  })

  it('falls back to flat for a grouped category without a grouped table, warning once per id', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
    expect(getGroupedRwaCategory(makeCategory('commodities', true))).toBe(RwaCategory.UNSPECIFIED)
    expect(getGroupedRwaCategory(makeCategory('commodities', true))).toBe(RwaCategory.UNSPECIFIED)
    expect(getGroupedRwaCategory(makeCategory('gaming', true))).toBe(RwaCategory.UNSPECIFIED)
    expect(warn).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })
})
