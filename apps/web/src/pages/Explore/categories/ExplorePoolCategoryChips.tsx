import { Flex } from '@universe/mycelium'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { CategoryChipRow } from '~/pages/Explore/categories/CategoryChipRow'
import { deriveCategoryChipOptions, useFlexSlotCategoryId } from '~/pages/Explore/categories/exploreCategoryChipOptions'

// Pool chips keep empty categories for now; the More dropdown still disables them.
const KEEP_EMPTY_POOL_CATEGORIES = (): boolean => false

/** Pool category chip row above the Explore pools table; renders nothing with the flag off. */
export function ExplorePoolCategoryChips({
  categories,
  category,
  chipsEnabled,
  categoriesLoading,
  onChange,
}: {
  /** Ordered pool categories (see useExplorePoolCategories). */
  categories: PoolCategory[]
  /** Selected category id, or All. */
  category: string
  chipsEnabled: boolean
  categoriesLoading: boolean
  onChange: (category: string) => void
}): JSX.Element | null {
  const { t } = useTranslation()
  const flexSlotCategoryId = useFlexSlotCategoryId({
    kind: 'pool',
    categories,
    selectedCategoryId: category,
    isCategoryEmpty: KEEP_EMPTY_POOL_CATEGORIES,
  })
  const options = useMemo(
    () =>
      deriveCategoryChipOptions({
        kind: 'pool',
        categories,
        selectedCategoryId: category,
        flexSlotCategoryId,
        isCategoryEmpty: KEEP_EMPTY_POOL_CATEGORIES,
        t,
      }),
    [categories, category, flexSlotCategoryId, t],
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
        onChange={onChange}
        loading={categoriesLoading}
        moreCategories={categories}
      />
    </Flex>
  )
}
