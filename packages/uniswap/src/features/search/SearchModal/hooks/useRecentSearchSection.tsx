import { UniverseChainId } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { SearchModalListOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { ClearRecentSearchesButton } from 'uniswap/src/features/search/ClearRecentSearchesButton'
import {
  RECENT_SEARCH_PILLS_MAX_COUNT,
  RECENT_SEARCH_PILLS_SKELETON_MAX_COUNT,
} from 'uniswap/src/features/search/SearchModal/constants'
import { useRecentlySearchedOptions } from 'uniswap/src/features/search/SearchModal/hooks/useRecentlySearchedOptions'
import { optionChainAddresses } from 'uniswap/src/features/search/SearchModal/stocks/applyRwaGrouping'
import { findRwaForToken } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'
import { tagOptionAsRwa } from 'uniswap/src/features/search/SearchModal/stocks/tagOptionAsRwa'
import { useRwaIndex } from 'uniswap/src/features/search/SearchModal/stocks/useRwaIndex'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'

export interface RecentSearchSection {
  sections: OnchainItemSection<SearchModalListOption>[] | undefined
  skeletonPillCount: number
}

/**
 * Recent searches for the no-query state. The section holds a single array item that SearchModalList renders as
 * one horizontal pill row (dispatched on sectionKey).
 */
export function useRecentSearchSection({
  chainFilter,
  activeTab,
}: {
  chainFilter: UniverseChainId | null
  activeTab: SearchTab
}): RecentSearchSection {
  const { t } = useTranslation()
  const rwaIndex = useRwaIndex()
  const plainTokenNames = useIsTokenCategoriesEnabled()

  const { options: recentlySearchedOptions, historyCount } = useRecentlySearchedOptions({
    chainFilter,
    activeTab,
    numberOfRecentSearchResults: RECENT_SEARCH_PILLS_MAX_COUNT,
  })

  // Tag recently-searched tokens that are tokenized stocks so they render the category tag. Recents stay individual
  // token rows (no collection roll-up); reuse the query-state extraction + lookup so the two paths can't drift.
  const taggedRecentlySearchedOptions = useMemo(() => {
    if (!rwaIndex.rwas.length) {
      return recentlySearchedOptions
    }
    return recentlySearchedOptions.map((option) => {
      const match = optionChainAddresses(option)
        .map((ca) => findRwaForToken(rwaIndex, ca))
        .find(Boolean)
      return match ? tagOptionAsRwa({ option, match, plainTokenNames }) : option
    })
  }, [rwaIndex, recentlySearchedOptions, plainTokenNames])

  const sectionOptions: SearchModalListOption[] = useMemo(
    () => (taggedRecentlySearchedOptions.length ? [taggedRecentlySearchedOptions] : []),
    [taggedRecentlySearchedOptions],
  )

  const sections = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.RecentSearches,
    options: sectionOptions,
    name: t('tokens.selectorV2.section.recent'),
    endElement: <ClearRecentSearchesButton />,
  })

  return { sections, skeletonPillCount: Math.min(historyCount, RECENT_SEARCH_PILLS_SKELETON_MAX_COUNT) }
}
