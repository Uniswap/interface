import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  findTokenCategoryForRwaCategory,
  getRwaCategoryForCategoryId,
  getRwaCategoryForTokenCategory,
} from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'
import { TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'

describe(getRwaCategoryForCategoryId, () => {
  it('maps backend group category ids to the RWA enum, UNSPECIFIED otherwise', () => {
    expect(getRwaCategoryForCategoryId('commodities')).toBe(RwaCategory.COMMODITIES)
    expect(getRwaCategoryForCategoryId('defi')).toBe(RwaCategory.UNSPECIFIED)
  })
})

describe(getRwaCategoryForTokenCategory, () => {
  it.each([
    ['stocks', RwaCategory.STOCKS],
    ['etfs', RwaCategory.ETFS],
    ['commodities', RwaCategory.COMMODITIES],
  ])('maps the %s backend id to its RWA enum value', (id, expected) => {
    const category = tokenCategory({ id, categoryClass: TokenCategoryClass.Asset })
    expect(getRwaCategoryForTokenCategory(category)).toBe(expected)
  })

  it('returns UNSPECIFIED for categories without an RWA counterpart', () => {
    const category = tokenCategory({ id: 'stablecoins', name: 'Stablecoins', categoryClass: TokenCategoryClass.Sector })
    expect(getRwaCategoryForTokenCategory(category)).toBe(RwaCategory.UNSPECIFIED)
  })

  it('keys off the id, not the display name', () => {
    const decoy = tokenCategory({ id: 'defi', name: 'Stocks', categoryClass: TokenCategoryClass.Asset })
    expect(getRwaCategoryForTokenCategory(decoy)).toBe(RwaCategory.UNSPECIFIED)
  })
})

describe(findTokenCategoryForRwaCategory, () => {
  const categories = [
    tokenCategory({ id: 'defi', name: 'DeFi', categoryClass: TokenCategoryClass.Sector }),
    tokenCategory({ id: 'stocks', name: 'Stocks', categoryClass: TokenCategoryClass.Asset }),
    tokenCategory({ id: 'commodities', name: 'Commodities', categoryClass: TokenCategoryClass.Asset }),
  ]

  it('finds the category matching the RWA enum value', () => {
    expect(findTokenCategoryForRwaCategory({ categories, rwaCategory: RwaCategory.STOCKS })?.id).toBe('stocks')
    expect(findTokenCategoryForRwaCategory({ categories, rwaCategory: RwaCategory.COMMODITIES })?.id).toBe(
      'commodities',
    )
  })

  it('returns undefined when the category is missing or unspecified', () => {
    expect(findTokenCategoryForRwaCategory({ categories, rwaCategory: RwaCategory.ETFS })).toBeUndefined()
    expect(findTokenCategoryForRwaCategory({ categories, rwaCategory: RwaCategory.UNSPECIFIED })).toBeUndefined()
  })
})
