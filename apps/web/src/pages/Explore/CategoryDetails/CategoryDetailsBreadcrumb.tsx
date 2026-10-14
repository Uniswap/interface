import { Text } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from '~/components/BreadcrumbNav'
import { getExploreTokensURL } from '~/pages/Explore/categories/useExploreCategory'
import { parseCategoryDetailsNavState } from '~/pages/Explore/CategoryDetails/categoryDetailsEntryPoint'

export function CategoryDetailsBreadcrumb({ categoryName }: { categoryName?: string }): JSX.Element {
  const { t } = useTranslation()
  const { state } = useLocation()
  const entryPoint = parseCategoryDetailsNavState(state)

  return (
    <BreadcrumbNavContainer aria-label="breadcrumb-nav" mb="$none">
      <BreadcrumbNavLink to={entryPoint?.from ?? getExploreTokensURL()}>
        {entryPoint?.fromLabel ?? t('common.token.plural')}
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
