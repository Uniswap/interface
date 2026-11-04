import { useIsTokenCategoriesEnabledWithLoading } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router'
import { useTokenCategoryBySlug } from 'uniswap/src/data/apiClients/dataApiService/categories/useTokenCategoryBySlug'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import type { Category, CategoryKind } from 'uniswap/src/features/tokenCategories/types'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { getExplorePoolsURL, getExploreTokensURL } from '~/pages/Explore/categories/useExploreCategory'
import { CategoryDetailsBreadcrumb } from '~/pages/Explore/CategoryDetails/CategoryDetailsBreadcrumb'
import {
  CategoryDetailsHeader,
  CategoryDetailsHeaderSkeleton,
} from '~/pages/Explore/CategoryDetails/CategoryDetailsHeader'
import { CategoryPoolsSection } from '~/pages/Explore/CategoryDetails/CategoryPoolsSection'
import { CategoryStatsRow } from '~/pages/Explore/CategoryDetails/CategoryStatsRow'
import { CategoryTokensSection } from '~/pages/Explore/CategoryDetails/CategoryTokensSection'

function PageShell({
  kind,
  categoryName,
  children,
}: {
  kind: CategoryKind
  categoryName?: string
  children: ReactNode
}): JSX.Element {
  return (
    <Flex width="100%" minWidth={320} pb="$spacing48">
      <Flex
        maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
        width="100%"
        mx="auto"
        pt="$spacing48"
        $xxl={{ px: '$spacing40' }}
        $lg={{ px: '$padding20' }}
        $md={{ px: '$none', pt: '$none' }}
      >
        <CategoryDetailsBreadcrumb kind={kind} categoryName={categoryName} />
        <Flex gap="$spacing24" mt="$spacing20">
          {children}
        </Flex>
      </Flex>
    </Flex>
  )
}

/**
 * Shared page body for both category kinds. The kind-specific pages resolve the flag and slug with their own
 * hooks so a pool page never fetches the token list, and vice versa.
 */
export function CategoryDetailsContent({
  kind,
  category,
  isFlagLoading,
  isFlagEnabled,
  isCategoryLoading,
}: {
  kind: CategoryKind
  category: Category | undefined
  isFlagLoading: boolean
  isFlagEnabled: boolean
  isCategoryLoading: boolean
}): JSX.Element {
  // Flag-off and unknown-slug loads land on the kind's list instead of a dead page.
  const listURL = kind === 'pool' ? getExplorePoolsURL() : getExploreTokensURL()

  // Skeletons stay outside Trace so a cold load with the flag off neither logs an impression nor flashes the page.
  // Flag gate comes before the category-loading gate: a flag-off load must redirect as soon as the flag resolves,
  // not wait out a category lookup that never runs while the flag is off.
  if (isFlagLoading) {
    return (
      <PageShell kind={kind}>
        <CategoryDetailsHeaderSkeleton />
      </PageShell>
    )
  }

  if (!isFlagEnabled) {
    return <Navigate to={listURL} replace />
  }

  if (isCategoryLoading) {
    return (
      <PageShell kind={kind}>
        <CategoryDetailsHeaderSkeleton />
      </PageShell>
    )
  }

  if (!category) {
    return <Navigate to={listURL} replace />
  }

  return (
    <Trace
      logImpression
      page={InterfacePageName.CategoryDetailsPage}
      properties={{ category_id: category.id, category_kind: category.kind }}
    >
      <PageShell kind={kind} categoryName={category.name}>
        <CategoryDetailsHeader category={category} />
        <CategoryStatsRow kind={category.kind} categoryId={category.id} />
        {category.kind === 'token' ? (
          <CategoryTokensSection category={category} />
        ) : (
          <CategoryPoolsSection category={category} />
        )}
      </PageShell>
    </Trace>
  )
}

export default function CategoryDetailsPage(): JSX.Element {
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const { value: isFlagEnabled, isLoading: isFlagLoading } = useIsTokenCategoriesEnabledWithLoading()
  const { category, isLoading: isCategoryLoading } = useTokenCategoryBySlug(categorySlug)

  return (
    <CategoryDetailsContent
      kind="token"
      category={category}
      isFlagLoading={isFlagLoading}
      isFlagEnabled={isFlagEnabled}
      isCategoryLoading={isCategoryLoading}
    />
  )
}
