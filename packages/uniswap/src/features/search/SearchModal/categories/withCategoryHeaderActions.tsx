import { OnchainItemListOptionType, type SearchModalListOption } from 'uniswap/src/components/lists/items/types'
import { toFlatRowIndex } from 'uniswap/src/components/lists/OnchainItemList/processSectionsToRows'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import type { SearchModalOptionSelection } from 'uniswap/src/features/search/SearchModal/hooks/useSearchModalOptionSelection'
import { CategoryDefinitionTooltip } from 'uniswap/src/features/tokenCategories/CategoryDefinitionTooltip'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

/** Header selections have no row of their own. */
const HEADER_SELECTION_INDEX = -1

/** Category section headers open Category Details, from the header itself or from "View all" in its tooltip. */
export function withCategoryHeaderActions({
  sections,
  categories,
  openCategoryDetails,
}: {
  sections: OnchainItemSection<SearchModalListOption>[] | undefined
  categories: TokenCategory[]
  openCategoryDetails: (selection: SearchModalOptionSelection) => void
}): OnchainItemSection<SearchModalListOption>[] {
  const resolvedSections = sections ?? []
  return resolvedSections.map((section, sectionIndex) => {
    const category = section.categoryId
      ? categories.find((candidate) => candidate.id === section.categoryId)
      : undefined
    if (!category) {
      return section
    }
    const selection: SearchModalOptionSelection = {
      item: { type: OnchainItemListOptionType.Category, category },
      section,
      index: HEADER_SELECTION_INDEX,
      rowIndex: toFlatRowIndex({ sections: resolvedSections, sectionIndex, itemIndex: 0 }),
    }
    const onPress = (): void => openCategoryDetails(selection)
    return {
      ...section,
      onPress,
      rightElement: <CategoryDefinitionTooltip category={category} onPressViewAll={onPress} />,
    }
  })
}
