import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { getRwaTagCategory } from 'uniswap/src/data/rest/rwa/getRwaTagCategory'

// The backend pre-sorts `Rwa.categories` by display order (COMMODITIES, ETFS, STOCKS) and never emits
// UNSPECIFIED, so the FE takes the array's first (highest-priority) category.
describe('getRwaTagCategory', () => {
  it('returns the first category in backend array order', () => {
    expect(getRwaTagCategory({ categories: [RwaCategory.COMMODITIES, RwaCategory.ETFS] })).toBe(RwaCategory.COMMODITIES)
    expect(getRwaTagCategory({ categories: [RwaCategory.ETFS, RwaCategory.STOCKS] })).toBe(RwaCategory.ETFS)
    expect(getRwaTagCategory({ categories: [RwaCategory.COMMODITIES, RwaCategory.STOCKS] })).toBe(
      RwaCategory.COMMODITIES,
    )
  })

  it('uses backend array order (a STOCKS-led array returns STOCKS)', () => {
    // Same categories as the first case in the opposite order → the first entry (STOCKS) wins.
    expect(getRwaTagCategory({ categories: [RwaCategory.STOCKS, RwaCategory.ETFS] })).toBe(RwaCategory.STOCKS)
  })

  it('returns the sole classified category', () => {
    expect(getRwaTagCategory({ categories: [RwaCategory.ETFS] })).toBe(RwaCategory.ETFS)
    expect(getRwaTagCategory({ categories: [RwaCategory.STOCKS] })).toBe(RwaCategory.STOCKS)
    expect(getRwaTagCategory({ categories: [RwaCategory.COMMODITIES] })).toBe(RwaCategory.COMMODITIES)
  })

  it('skips a leading UNSPECIFIED defensively', () => {
    expect(getRwaTagCategory({ categories: [RwaCategory.UNSPECIFIED, RwaCategory.ETFS] })).toBe(RwaCategory.ETFS)
  })

  it('returns UNSPECIFIED when empty, all-unspecified, or missing', () => {
    expect(getRwaTagCategory({ categories: [] })).toBe(RwaCategory.UNSPECIFIED)
    expect(getRwaTagCategory({ categories: [RwaCategory.UNSPECIFIED] })).toBe(RwaCategory.UNSPECIFIED)
    expect(getRwaTagCategory({})).toBe(RwaCategory.UNSPECIFIED)
  })
})
