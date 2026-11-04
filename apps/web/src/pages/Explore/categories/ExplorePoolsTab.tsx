import { memo } from 'react'
import { ExplorePoolCategoryChips } from '~/pages/Explore/categories/ExplorePoolCategoryChips'
import { ExploreCategory, useExploreCategory } from '~/pages/Explore/categories/useExploreCategory'
import { useExplorePoolCategories } from '~/pages/Explore/categories/useExplorePoolCategories'
import { ExploreTopPoolTable } from '~/pages/Explore/tables/Pools/PoolTable'

/** The Explore Pools tab: the pool category chip row and the ranked pools table it filters. Memoized: Explore's `Page` slot wants a stable component. */
export const ExplorePoolsTab = memo(function ExplorePoolsTab(): JSX.Element {
  const { orderedCategories, validCategoryIds, chipsEnabled, categoriesPending, categoriesLoading } =
    useExplorePoolCategories()
  const [category, setCategory] = useExploreCategory({
    kind: 'pool',
    validCategoryIds,
    trustUnverifiedIds: categoriesPending,
  })
  const categoryId = category === ExploreCategory.All ? undefined : category

  return (
    <>
      <ExplorePoolCategoryChips
        categories={orderedCategories}
        category={category}
        chipsEnabled={chipsEnabled}
        categoriesLoading={categoriesLoading}
        onChange={setCategory}
      />
      <ExploreTopPoolTable
        surface="explore"
        categoryId={categoryId}
        categoryUnverified={categoryId !== undefined && !validCategoryIds.has(categoryId)}
      />
    </>
  )
})
