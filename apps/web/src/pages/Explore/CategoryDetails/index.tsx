import { useIsTokenCategoriesEnabledWithLoading } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router'
import { useTokenCategoryBySlug } from 'uniswap/src/data/apiClients/dataApiService/categories/useTokenCategoryBySlug'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { CategoryDetailsBreadcrumb } from '~/pages/Explore/CategoryDetails/CategoryDetailsBreadcrumb'
import {
  CategoryDetailsHeader,
  CategoryDetailsHeaderSkeleton,
} from '~/pages/Explore/CategoryDetails/CategoryDetailsHeader'
import { CategoryStatsRow } from '~/pages/Explore/CategoryDetails/CategoryStatsRow'
import { CategoryTokensSection } from '~/pages/Explore/CategoryDetails/CategoryTokensSection'

function PageShell({ categoryName, children }: { categoryName?: string; children: ReactNode }): JSX.Element {
  return (
    <Flex width="100%" minWidth={320} pb="$spacing48">
      <Flex
        maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
        width="100%"
        mx="auto"
        gap="$spacing24"
        pt="$spacing48"
        px="$spacing40"
        $md={{ px: '$spacing16', pt: '$spacing24' }}
      >
        <CategoryDetailsBreadcrumb categoryName={categoryName} />
        {children}
      </Flex>
    </Flex>
  )
}

export default function CategoryDetailsPage(): JSX.Element {
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const { value: isTokenCategoriesEnabled, isLoading: isFlagLoading } = useIsTokenCategoriesEnabledWithLoading()
  const { category, isLoading: isCategoryLoading } = useTokenCategoryBySlug(categorySlug)

  // Skeletons stay outside Trace so a cold load with the flag off neither logs an impression nor flashes the page.
  // Flag gate comes before the category-loading gate: a flag-off load must redirect as soon as the flag resolves,
  // not wait out a category lookup that never runs while the flag is off.
  if (isFlagLoading) {
    return (
      <PageShell>
        <CategoryDetailsHeaderSkeleton />
      </PageShell>
    )
  }

  if (!isTokenCategoriesEnabled) {
    return <Navigate to="/explore" replace />
  }

  if (isCategoryLoading) {
    return (
      <PageShell>
        <CategoryDetailsHeaderSkeleton />
      </PageShell>
    )
  }

  if (!category) {
    return <Navigate to="/explore" replace />
  }

  return (
    <Trace logImpression page={InterfacePageName.CategoryDetailsPage} properties={{ category_id: category.id }}>
      <PageShell categoryName={category.name}>
        <CategoryDetailsHeader category={category} />
        <CategoryStatsRow categoryId={category.id} />
        <CategoryTokensSection category={category} />
      </PageShell>
    </Trace>
  )
}
