import { getCategoryDetailsTitle, getPoolCategoryDetailsTitle } from '~/pages/getExploreTitle'

describe('getCategoryDetailsTitle', () => {
  it('names the category from the slug, or falls back to the generic title', () => {
    expect(getCategoryDetailsTitle('/explore/category/top-gainers')).toBe('Explore Top gainers tokens on Uniswap')
    expect(getCategoryDetailsTitle('/explore/category/:categorySlug')).toBe('Explore token categories on Uniswap')
  })
})

describe('getPoolCategoryDetailsTitle', () => {
  it('drops the redundant "pools" suffix most pool category ids carry', () => {
    expect(getPoolCategoryDetailsTitle('/pools/category/stable-pools')).toBe('Explore Stable pools on Uniswap')
    expect(getPoolCategoryDetailsTitle('/pools/category/correlated')).toBe('Explore Correlated pools on Uniswap')
    expect(getPoolCategoryDetailsTitle('/pools/category/:categorySlug')).toBe('Explore pool categories on Uniswap')
  })
})
