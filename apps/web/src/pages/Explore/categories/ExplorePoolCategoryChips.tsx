import { Flex } from '@universe/mycelium'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { CategoryChipRow } from '~/pages/Explore/categories/CategoryChipRow'
import { deriveCategoryChipOptions, useFlexSlotCategoryId } from '~/pages/Explore/categories/exploreCategoryChipOptions'
import { useExploreCategory } from '~/pages/Explore/categories/useExploreCategory'
import { useExplorePoolCategories } from '~/pages/Explore/categories/useExplorePoolCategories'

// Pool chips keep empty categories for now; the More dropdown still disables them.
const KEEP_EMPTY_POOL_CATEGORIES = (): boolean => false

/** Pool category chip row above the Explore pools table; renders nothing with the flag off. */
export function ExplorePoolCategoryChips(): JSX.Element | null {
  const { t } = useTranslation()
  const { orderedCategories, validCategoryIds, chipsEnabled, categoriesPending, categoriesLoading } =
    useExplorePoolCategories()
  const [category, setCategory] = useExploreCategory({
    kind: 'pool',
    validCategoryIds,
    trustUnverifiedIds: categoriesPending,
  })
  const flexSlotCategoryId = useFlexSlotCategoryId({
    kind: 'pool',
    categories: orderedCategories,
    selectedCategoryId: category,
    isCategoryEmpty: KEEP_EMPTY_POOL_CATEGORIES,
  })
  const options = useMemo(
    () =>
      deriveCategoryChipOptions({
        kind: 'pool',
        categories: orderedCategories,
        selectedCategoryId: category,
        flexSlotCategoryId,
        isCategoryEmpty: KEEP_EMPTY_POOL_CATEGORIES,
        t,
      }),
    [orderedCategories, category, flexSlotCategoryId, t],
  )

  if (!categoriesLoading && !chipsEnabled) {
    return null
  }

  return (
    <Flex width="100%" maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT} mx="auto" mb="$spacing8" $md={{ mb: '$spacing16' }}>
      <CategoryChipRow
        kind="pool"
        options={options}
        value={category}
        onChange={setCategory}
        loading={categoriesLoading}
        moreCategories={orderedCategories}
      />
    </Flex>
  )
}
