import { useIsPoolCategoriesEnabledWithLoading } from '@universe/gating'
import { useParams } from 'react-router'
import { usePoolCategoryBySlug } from 'uniswap/src/data/apiClients/dataApiService/categories/usePoolCategoryBySlug'
import { CategoryDetailsContent } from '~/pages/Explore/CategoryDetails'

/** `/pools/category/:categorySlug`; the stats row and pools table land in their own changes. */
export default function PoolCategoryDetailsPage(): JSX.Element {
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const { value: isFlagEnabled, isLoading: isFlagLoading } = useIsPoolCategoriesEnabledWithLoading()
  const { category, isLoading: isCategoryLoading } = usePoolCategoryBySlug(categorySlug)

  return (
    <CategoryDetailsContent
      kind="pool"
      category={category}
      isFlagLoading={isFlagLoading}
      isFlagEnabled={isFlagEnabled}
      isCategoryLoading={isCategoryLoading}
    />
  )
}
