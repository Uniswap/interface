import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from '~/components/BreadcrumbNav'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

export function TDPBreadcrumb() {
  const currency = useTDPStore((s) => s.currency)!
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
      $md={{ pt: '$none' }}
    >
      <BreadcrumbNavLink to={state?.from ?? '/explore/tokens'}>
        {t('common.tokens')}
        <RotatableChevron direction="right" size="$icon.16" />
      </BreadcrumbNavLink>
      <CurrentPageBreadcrumb currency={currency} />
    </BreadcrumbNavContainer>
  )
}
