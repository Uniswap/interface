import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from '~/components/BreadcrumbNav'
import { getExploreStocksTableURL, getExploreTokensURL } from '~/pages/Explore/categories/useExploreCategory'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTDPRWAMatch } from '~/pages/TokenDetails/hooks/useTDPRWAMatch'

export function TDPBreadcrumb() {
  const currency = useTDPStore((s) => s.currency)!
  const { t } = useTranslation()
  const { state } = useLocation()
  const isExploreTableEnabled = useFeatureFlag(FeatureFlags.RWAUXExplore)
  const rwaMatch = useTDPRWAMatch({ enabled: isExploreTableEnabled })
  const showStocksBreadcrumb = isExploreTableEnabled && !!rwaMatch

  // RWA trail: Tokens → default tab; Stocks crumb uses `?category=stocks` via getExploreStocksTableURL().
  const tokensExploreUrl = showStocksBreadcrumb ? getExploreTokensURL() : (state?.from ?? getExploreTokensURL())

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
      <BreadcrumbNavLink to={tokensExploreUrl}>
        {t('common.token.plural')}
        <RotatableChevron direction="right" size="$icon.16" />
      </BreadcrumbNavLink>
      {showStocksBreadcrumb && (
        <BreadcrumbNavLink to={getExploreStocksTableURL()}>
          {t('common.stocks')}
          <RotatableChevron direction="right" size="$icon.16" />
        </BreadcrumbNavLink>
      )}
      <CurrentPageBreadcrumb currency={currency} />
    </BreadcrumbNavContainer>
  )
}
