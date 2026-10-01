import {
  OnchainItemListOptionType,
  type SearchModalListOption,
  type SearchModalOption,
} from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { countSearchResultRows } from 'uniswap/src/features/search/SearchModal/analytics/countSearchResultRows'

const tokenOption = { type: OnchainItemListOptionType.Token } as SearchModalOption

function section(
  sectionKey: OnchainItemSectionName,
  data: SearchModalListOption[],
): OnchainItemSection<SearchModalListOption> {
  return { sectionKey, data }
}

describe(countSearchResultRows, () => {
  it('counts rows across sections, flattening a pill row to its pills', () => {
    // Search V2 recents render as one pill row: a single array item holding every pill.
    const recentsPillRow = section(OnchainItemSectionName.RecentSearches, [[tokenOption, tokenOption, tokenOption]])
    expect(countSearchResultRows([recentsPillRow, section(OnchainItemSectionName.Tokens, [tokenOption])])).toBe(4)
  })

  it('returns 0 without sections', () => {
    expect(countSearchResultRows(undefined)).toBe(0)
    expect(countSearchResultRows([])).toBe(0)
  })
})
