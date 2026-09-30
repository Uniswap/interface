import { isMobileApp } from '@universe/environment'
import { Flex } from '@universe/mycelium'
import type { SearchModalListOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SEARCH_ALL_TAB_SECTION_GAP } from 'uniswap/src/features/search/SearchModal/constants'

export function SectionGapSpacer(): JSX.Element {
  return <Flex height={SEARCH_ALL_TAB_SECTION_GAP} />
}

export function hasSectionGap(sectionKey: OnchainItemSectionName): boolean {
  return !(isMobileApp && sectionKey === OnchainItemSectionName.RecentSearches)
}

export function withSectionGaps(
  sections: OnchainItemSection<SearchModalListOption>[] | undefined,
): OnchainItemSection<SearchModalListOption>[] | undefined {
  return sections?.map((section, index) =>
    index === sections.length - 1 || !hasSectionGap(section.sectionKey)
      ? section
      : {
          ...section,
          footerElement: (
            <>
              {section.footerElement}
              <SectionGapSpacer />
            </>
          ),
        },
  )
}
