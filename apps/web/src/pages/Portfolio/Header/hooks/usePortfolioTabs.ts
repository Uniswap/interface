import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'

export type PortfolioTabInfo = {
  path: string
  pageName: InterfacePageName
  label: string
}

export function usePortfolioTabs(): PortfolioTabInfo[] {
  const { t } = useTranslation()
  const isPortfolioDefiTabEnabled = useFeatureFlag(FeatureFlags.PortfolioDefiTab)

  return [
    { path: '/portfolio', pageName: InterfacePageName.PortfolioPage, label: t('portfolio.overview.title') },
    { path: '/portfolio/tokens', pageName: InterfacePageName.PortfolioTokensPage, label: t('portfolio.tokens.title') },
    ...(isPortfolioDefiTabEnabled
      ? [{ path: '/portfolio/defi', pageName: InterfacePageName.PortfolioDefiPage, label: t('portfolio.defi.title') }]
      : []),
    { path: '/portfolio/nfts', pageName: InterfacePageName.PortfolioNftsPage, label: t('portfolio.nfts.title') },
    {
      path: '/portfolio/activity',
      pageName: InterfacePageName.PortfolioActivityPage,
      label: t('portfolio.activity.title'),
    },
  ]
}
