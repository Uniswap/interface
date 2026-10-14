import type { SearchModalListOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { withViewAllFooters } from 'uniswap/src/features/search/SearchModal/viewAll/withViewAllFooters'

function section(sectionKey: OnchainItemSectionName, categoryId?: string): OnchainItemSection<SearchModalListOption> {
  return { sectionKey, categoryId, data: [] }
}

describe('withViewAllFooters', () => {
  it('resting state: footers every trimmed section, opening its tab', () => {
    const onViewAll = vi.fn()
    const recents = section(OnchainItemSectionName.RecentSearches)
    const wallets = section(OnchainItemSectionName.FavoriteWallets)
    const [recentsOut, category, pools, walletsOut] =
      withViewAllFooters({
        sections: [
          recents,
          section(OnchainItemSectionName.Category),
          section(OnchainItemSectionName.TrendingPools),
          wallets,
        ],
        truncatedSectionKeys: 'all',
        onViewAll,
      }) ?? []

    expect(recentsOut).toBe(recents)
    expect(walletsOut).toBe(wallets)
    expect(category?.footerElement?.props.destination).toEqual({ type: 'tab', tab: SearchTab.Tokens })
    expect(pools?.footerElement?.props.destination).toEqual({ type: 'tab', tab: SearchTab.Pools })

    pools?.footerElement?.props.onPress()
    expect(onViewAll).toHaveBeenCalledWith(SearchTab.Pools)
  })

  it('search results: footers only the truncated sections', () => {
    const tokens = section(OnchainItemSectionName.Tokens)
    const [tokensOut, pools] =
      withViewAllFooters({
        sections: [tokens, section(OnchainItemSectionName.Pools)],
        truncatedSectionKeys: [OnchainItemSectionName.Pools],
        onViewAll: vi.fn(),
      }) ?? []

    expect(tokensOut).toBe(tokens)
    expect(pools?.footerElement?.props.destination).toEqual({ type: 'tab', tab: SearchTab.Pools })
  })

  it('category sections leave for Category Details when the host can navigate there', () => {
    const onViewAll = vi.fn()
    const onViewAllCategory = vi.fn()
    const [category] =
      withViewAllFooters({
        sections: [section(OnchainItemSectionName.Category, 'trending')],
        truncatedSectionKeys: 'all',
        onViewAll,
        onViewAllCategory,
      }) ?? []

    expect(category?.footerElement?.props.destination).toEqual({ type: 'category', categoryId: 'trending' })

    category?.footerElement?.props.onPress()
    expect(onViewAllCategory).toHaveBeenCalledWith('trending')
    expect(onViewAll).not.toHaveBeenCalled()
  })

  it('category sections fall back to the Tokens tab without a Category Details host', () => {
    const [category] =
      withViewAllFooters({
        sections: [section(OnchainItemSectionName.Category, 'trending')],
        truncatedSectionKeys: 'all',
        onViewAll: vi.fn(),
      }) ?? []

    expect(category?.footerElement?.props.destination).toEqual({ type: 'tab', tab: SearchTab.Tokens })
  })
})
