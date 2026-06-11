import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { getRwaTagCategory } from 'uniswap/src/data/rest/rwa/getRwaTagCategory'

describe('getRwaTagCategory', () => {
  it('returns the sole classified category', () => {
    expect(getRwaTagCategory({ categories: [RwaCategory.ETFS] })).toBe(RwaCategory.ETFS)
    expect(getRwaTagCategory({ categories: [RwaCategory.STOCKS] })).toBe(RwaCategory.STOCKS)
  })

  it('picks by explicit priority, not backend array order', () => {
    expect(getRwaTagCategory({ categories: [RwaCategory.ETFS, RwaCategory.STOCKS] })).toBe(RwaCategory.STOCKS)
    expect(getRwaTagCategory({ categories: [RwaCategory.STOCKS, RwaCategory.ETFS] })).toBe(RwaCategory.STOCKS)
  })

  it('ignores UNSPECIFIED', () => {
    expect(getRwaTagCategory({ categories: [RwaCategory.UNSPECIFIED, RwaCategory.ETFS] })).toBe(RwaCategory.ETFS)
  })

  it('returns UNSPECIFIED when empty, all-unspecified, or missing', () => {
    expect(getRwaTagCategory({ categories: [] })).toBe(RwaCategory.UNSPECIFIED)
    expect(getRwaTagCategory({ categories: [RwaCategory.UNSPECIFIED] })).toBe(RwaCategory.UNSPECIFIED)
    expect(getRwaTagCategory({})).toBe(RwaCategory.UNSPECIFIED)
  })
})
