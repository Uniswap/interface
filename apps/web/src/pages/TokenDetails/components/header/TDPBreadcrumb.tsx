import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from '~/components/BreadcrumbNav'
import { useTDPContext } from '~/pages/TokenDetails/context/TDPContext'

export function TDPBreadcrumb() {
  const { currency } = useTDPContext()
  const { t } = useTranslation()
  const { state } = useLocation()

  return (
    <BreadcrumbNavContainer
      aria-label="breadcrumb-nav"
      width="100%"
      px="$spacing40"
      pt="$spacing48"
      mb="$spacing8"
      $lg={{ px: '$padding20' }}
    >
      <BreadcrumbNavLink to={state?.from ?? '/explore/tokens'}>
        {t('common.tokens')}
        <RotatableChevron direction="right" size="$icon.16" />
      </BreadcrumbNavLink>
      <CurrentPageBreadcrumb currency={currency} />
    </BreadcrumbNavContainer>
  )
}
