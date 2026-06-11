import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { HomeRoute } from 'src/screens/HomeScreen/portfolio/types'
import { SectionName } from 'uniswap/src/features/telemetry/constants'

export function useHomeScreenPortfolioRoutes(showEmptyWalletState: boolean): HomeRoute[] {
  const { t } = useTranslation()
  const tokensTitle = t('home.tokens.title')
  const nftsTitle = t('home.nfts.title')
  const exploreTitle = t('home.explore.title')

  return useMemo((): HomeRoute[] => {
    if (showEmptyWalletState) {
      return [
        {
          key: SectionName.HomeExploreTab,
          title: exploreTitle,
          textStyleType: 'secondary',
        },
      ]
    }

    return [
      { key: SectionName.HomeTokensTab, title: tokensTitle },
      { key: SectionName.HomeNFTsTab, title: nftsTitle },
    ]
  }, [showEmptyWalletState, tokensTitle, nftsTitle, exploreTitle])
}
