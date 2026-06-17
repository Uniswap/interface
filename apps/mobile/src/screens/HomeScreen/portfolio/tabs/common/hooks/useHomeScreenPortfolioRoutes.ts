import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { HomeTab, type HomeRoute } from 'src/screens/HomeScreen/portfolio/types'

export function useHomeScreenPortfolioRoutes(showEmptyWalletState: boolean, shouldShowPoolsTab: boolean): HomeRoute[] {
  const { t } = useTranslation()
  const tokensTitle = t('home.tokens.title')
  const nftsTitle = t('home.nfts.title')
  const poolsTitle = t('common.pools')
  const exploreTitle = t('home.explore.title')

  return useMemo((): HomeRoute[] => {
    if (showEmptyWalletState) {
      return [{ key: HomeTab.Explore, title: exploreTitle, textStyleType: 'secondary' }]
    }

    return [
      { key: HomeTab.Tokens, title: tokensTitle },
      ...(shouldShowPoolsTab ? [{ key: HomeTab.Pools, title: poolsTitle }] : []),
      { key: HomeTab.NFTs, title: nftsTitle },
    ]
  }, [showEmptyWalletState, shouldShowPoolsTab, tokensTitle, poolsTitle, nftsTitle, exploreTitle])
}
