import { PortfolioTab } from 'pages/Portfolio/types'
import i18n from 'uniswap/src/i18n'

export const getPortfolioTitle = (path?: string): string => {
  const parts = path?.split('/').filter((part) => part !== '')
  const tabsToFind = Object.values(PortfolioTab)
  const tab = (parts?.find((part) => tabsToFind.includes(part as PortfolioTab)) ??
    PortfolioTab.Overview) as PortfolioTab

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
