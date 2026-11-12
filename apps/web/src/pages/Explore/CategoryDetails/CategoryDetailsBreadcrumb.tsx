import { Text } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import type { CategoryKind } from 'uniswap/src/features/tokenCategories/types'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from '~/components/BreadcrumbNav'
import { getExplorePoolsURL, getExploreTokensURL } from '~/pages/Explore/categories/useExploreCategory'
import { parseCategoryDetailsNavState } from '~/utils/categoryDetailsEntryPoint'

export function CategoryDetailsBreadcrumb({
  categoryName,
  kind,
}: {
  categoryName?: string
  kind: CategoryKind
}): JSX.Element {
  const { t } = useTranslation()
  const { state } = useLocation()
  const entryPoint = parseCategoryDetailsNavState(state, kind)
  const listURL = kind === 'pool' ? getExplorePoolsURL() : getExploreTokensURL()
  const listLabel = kind === 'pool' ? t('common.pools') : t('common.token.plural')

  return (
    <BreadcrumbNavContainer aria-label="breadcrumb-nav" mb="$spacing8" minHeight="$spacing24">
      <BreadcrumbNavLink to={entryPoint?.from ?? listURL}>
        {entryPoint?.fromLabel ?? listLabel}
        <RotatableChevron direction="right" size="$icon.16" />
      </BreadcrumbNavLink>
      {categoryName && (
        <Text variant="body2" color="$neutral1" aria-current="page">
          {categoryName}
        </Text>
      )}
    </BreadcrumbNavContainer>
  )
}
