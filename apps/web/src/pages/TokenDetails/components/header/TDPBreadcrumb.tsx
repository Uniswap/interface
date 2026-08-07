import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from '~/components/BreadcrumbNav'
import { getExploreStocksTableURL, getExploreTokensURL } from '~/pages/Explore/categories/useExploreCategory'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTDPRWAMatch } from '~/pages/TokenDetails/hooks/useTDPRWAMatch'

const LAUNCHES_PATHNAME = '/launches'

export function TDPBreadcrumb() {
  const currency = useTDPStore((s) => s.currency)!
  const { t } = useTranslation()
  const { state } = useLocation()
  const isExploreTableEnabled = useFeatureFlag(FeatureFlags.RWAUXExplore)
  const rwaMatch = useTDPRWAMatch({ enabled: isExploreTableEnabled })
  const showStocksBreadcrumb = isExploreTableEnabled && !!rwaMatch

  // Entry point the row/card linked from (see TableRow's `state.from`); absent on direct navigation.
  const fromPathname: string | undefined = typeof state?.from === 'string' ? state.from : undefined

  // RWA trail: Tokens → default tab; Stocks crumb uses `?category=stocks` via getExploreStocksTableURL().
  const tokensExploreUrl = showStocksBreadcrumb ? getExploreTokensURL() : (fromPathname ?? getExploreTokensURL())
  const showLaunchesBreadcrumb = !showStocksBreadcrumb && Boolean(fromPathname?.startsWith(LAUNCHES_PATHNAME))

  return (
    <BreadcrumbNavContainer
      aria-label="breadcrumb-nav"
      width="100%"
      pt="$spacing48"
      mb="$spacing8"
      $xxl={{ px: '$spacing40' }}
      $lg={{ px: '$padding20' }}
      $md={{ pt: '$none' }}
    >
      <BreadcrumbNavLink to={tokensExploreUrl}>
        {showLaunchesBreadcrumb ? t('common.launches') : t('common.token.plural')}
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
