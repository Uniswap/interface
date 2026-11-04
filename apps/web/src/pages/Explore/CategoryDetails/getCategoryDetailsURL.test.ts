import { getCategoryDetailsURL } from '~/pages/Explore/CategoryDetails/getCategoryDetailsURL'

describe('getCategoryDetailsURL', () => {
  it('routes token categories under Explore by default', () => {
    expect(getCategoryDetailsURL('stocks')).toBe('/explore/category/stocks')
    expect(getCategoryDetailsURL('stocks', 'token')).toBe('/explore/category/stocks')
  })

  it('routes pool categories to the pools category page', () => {
    expect(getCategoryDetailsURL('stable-pools', 'pool')).toBe('/pools/category/stable-pools')
  })

  it('encodes the slug', () => {
    expect(getCategoryDetailsURL('a b', 'pool')).toBe('/pools/category/a%20b')
  })
})
