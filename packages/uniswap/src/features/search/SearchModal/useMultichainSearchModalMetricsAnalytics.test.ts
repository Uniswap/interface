import {
  type CategoryOption,
  OnchainItemListOptionType,
  type SearchModalListOption,
} from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { countCategoryResults } from 'uniswap/src/features/search/SearchModal/useMultichainSearchModalMetricsAnalytics'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'

function categoryOption(id: string): CategoryOption {
  return { type: OnchainItemListOptionType.Category, category: tokenCategory({ id }) }
}

const tokenOption = { type: OnchainItemListOptionType.Token } as SearchModalListOption

describe(countCategoryResults, () => {
  it('counts category rows across sections and ignores other rows', () => {
    const sections: OnchainItemSection<SearchModalListOption>[] = [
      {
        sectionKey: OnchainItemSectionName.Tokens,
        data: [categoryOption('stablecoins'), categoryOption('stocks'), tokenOption],
      },
      { sectionKey: OnchainItemSectionName.Pools, data: [tokenOption] },
    ]

    expect(countCategoryResults(sections)).toBe(2)
  })

  it('returns 0 when no category rows are shown or there are no sections', () => {
    expect(countCategoryResults([{ sectionKey: OnchainItemSectionName.Tokens, data: [tokenOption] }])).toBe(0)
    expect(countCategoryResults(undefined)).toBe(0)
  })
})
