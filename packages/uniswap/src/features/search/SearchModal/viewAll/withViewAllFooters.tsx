import type { SearchModalListOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { SearchSectionViewAllButton } from 'uniswap/src/features/search/SearchModal/viewAll/SearchSectionViewAllButton'

// Only sections the All tab trims, so their tab always has more to show. Recents, Stocks, and wallets aren't trimmed.
const SECTION_VIEW_ALL_TAB: Partial<Record<OnchainItemSectionName, SearchTab>> = {
  [OnchainItemSectionName.Tokens]: SearchTab.Tokens,
  [OnchainItemSectionName.TrendingTokens]: SearchTab.Tokens,
  // Fallback for hosts without a Category Details page (`onViewAllCategory` unset).
  [OnchainItemSectionName.Category]: SearchTab.Tokens,
  [OnchainItemSectionName.Pools]: SearchTab.Pools,
  [OnchainItemSectionName.TrendingPools]: SearchTab.Pools,
  [OnchainItemSectionName.Auctions]: SearchTab.Auctions,
  [OnchainItemSectionName.TopAuctions]: SearchTab.Auctions,
}

/**
 * All tab: gives trimmed sections a "View all" footer that opens their tab. `truncatedSectionKeys` names the sections
 * that actually have more results (search results), or `'all'` when every trimmed section does (resting state).
 * Category sections leave the modal for Category Details instead when `onViewAllCategory` is provided.
 */
export function withViewAllFooters({
  sections,
  truncatedSectionKeys,
  onViewAll,
  onViewAllCategory,
}: {
  sections: OnchainItemSection<SearchModalListOption>[] | undefined
  truncatedSectionKeys: OnchainItemSectionName[] | 'all'
  onViewAll: (tab: SearchTab) => void
  onViewAllCategory?: (categoryId: string) => void
}): OnchainItemSection<SearchModalListOption>[] | undefined {
  return sections?.map((section) => {
    const tab = SECTION_VIEW_ALL_TAB[section.sectionKey]
    if (!tab || (truncatedSectionKeys !== 'all' && !truncatedSectionKeys.includes(section.sectionKey))) {
      return section
    }
    const { categoryId } = section
    if (categoryId && onViewAllCategory) {
      return {
        ...section,
        footerElement: (
          <SearchSectionViewAllButton
            destination={{ type: 'category', categoryId }}
            onPress={() => onViewAllCategory(categoryId)}
          />
        ),
      }
    }
    return {
      ...section,
      footerElement: <SearchSectionViewAllButton destination={{ type: 'tab', tab }} onPress={() => onViewAll(tab)} />,
    }
  })
}
