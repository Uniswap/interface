import { describe, expect, it } from 'vitest'
import {
  categoryFromParam,
  ExploreCategory,
  getExploreStocksTableURL,
  getExploreTokensURL,
} from '~/pages/Explore/categories/useExploreCategory'

const VALID_IDS: ReadonlySet<string> = new Set(['stocks', 'commodities', 'etfs', 'defi'])

describe('categoryFromParam', () => {
  it('defaults to all', () => {
    expect(categoryFromParam({ value: null, validCategoryIds: VALID_IDS })).toBe(ExploreCategory.All)
  })

  it('passes through valid category ids', () => {
    expect(categoryFromParam({ value: 'stocks', validCategoryIds: VALID_IDS })).toBe('stocks')
    expect(categoryFromParam({ value: 'defi', validCategoryIds: VALID_IDS })).toBe('defi')
  })

  it('maps unknown category values to all', () => {
    expect(categoryFromParam({ value: 'unknown', validCategoryIds: VALID_IDS })).toBe(ExploreCategory.All)
  })

  it('hydrates a dynamic id once it joins the valid set', () => {
    const staticOnly: ReadonlySet<string> = new Set(['stocks', 'commodities', 'etfs'])
    expect(categoryFromParam({ value: 'defi', validCategoryIds: staticOnly })).toBe(ExploreCategory.All)
    expect(categoryFromParam({ value: 'defi', validCategoryIds: VALID_IDS })).toBe('defi')
  })

  describe('while categories are unverified', () => {
    const staticOnly: ReadonlySet<string> = new Set(['stocks', 'commodities', 'etfs'])

    it('trusts a well-formed slug that is not yet in the valid set', () => {
      expect(categoryFromParam({ value: 'defi', validCategoryIds: staticOnly, trustUnverifiedIds: true })).toBe('defi')
      expect(categoryFromParam({ value: 'ai-agents', validCategoryIds: staticOnly, trustUnverifiedIds: true })).toBe(
        'ai-agents',
      )
    })

    it.each(['DeFi', 'de fi', 'defi_', '-defi', 'defi/agents', 'a'.repeat(65)])(
      'still maps the malformed slug %j to all',
      (value) => {
        expect(categoryFromParam({ value, validCategoryIds: staticOnly, trustUnverifiedIds: true })).toBe(
          ExploreCategory.All,
        )
      },
    )

    it('drops a trusted slug back to all once the resolved set excludes it', () => {
      expect(categoryFromParam({ value: 'bogus', validCategoryIds: staticOnly, trustUnverifiedIds: true })).toBe(
        'bogus',
      )
      expect(categoryFromParam({ value: 'bogus', validCategoryIds: VALID_IDS, trustUnverifiedIds: false })).toBe(
        ExploreCategory.All,
      )
    })
  })
})

describe('getExploreTokensURL', () => {
  it('returns explore tokens URL without a category param', () => {
    expect(getExploreTokensURL()).toBe('/explore/tokens')
  })
})

describe('getExploreStocksTableURL', () => {
  it('returns explore tokens URL with stocks category param', () => {
    expect(getExploreStocksTableURL()).toBe('/explore/tokens?category=stocks')
  })
})
