import i18n from 'uniswap/src/i18n'
import { isPortfolioTab, PortfolioTab } from '~/pages/Portfolio/types'

export const getPortfolioTitle = (path?: string): string => {
  const parts = path?.split('/').filter((part) => part !== '')
  const tab = parts?.find(isPortfolioTab) ?? PortfolioTab.Overview

  switch (tab) {
    case PortfolioTab.Tokens:
      return i18n.t('web.portfolio.title.tokens')
    case PortfolioTab.Defi:
      return i18n.t('web.portfolio.title.defi')
    case PortfolioTab.Nfts:
      return i18n.t('web.portfolio.title.nfts')
    case PortfolioTab.Activity:
      return i18n.t('web.portfolio.title.activity')
    case PortfolioTab.Overview:
    default:
      return i18n.t('web.portfolio.title.overview')
  }
}

export const getPortfolioDescription = (): string => {
  return i18n.t('portfolio.description')
}
