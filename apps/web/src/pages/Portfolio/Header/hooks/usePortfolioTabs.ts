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
  const portfolioPoolsBalancesEnabled = useFeatureFlag(FeatureFlags.PortfolioPoolsBalances)

  return [
    { path: '/portfolio', pageName: InterfacePageName.PortfolioPage, label: t('portfolio.overview.title') },
    { path: '/portfolio/tokens', pageName: InterfacePageName.PortfolioTokensPage, label: t('common.token.plural') },
    ...(portfolioPoolsBalancesEnabled
      ? [
          {
            path: '/portfolio/pools',
            pageName: InterfacePageName.PortfolioPoolsPage,
            label: t('common.pools'),
          },
        ]
      : []),
    ...(isPortfolioDefiTabEnabled
      ? [{ path: '/portfolio/defi', pageName: InterfacePageName.PortfolioDefiPage, label: t('portfolio.defi.title') }]
      : []),
    { path: '/portfolio/nfts', pageName: InterfacePageName.PortfolioNftsPage, label: t('portfolio.nfts.title') },
    {
      path: '/portfolio/activity',
      pageName: InterfacePageName.PortfolioActivityPage,
      label: t('common.activity'),
    },
  ]
}
