export enum PortfolioTab {
  Overview = 'overview',
  Tokens = 'tokens',
  Defi = 'defi',
  Nfts = 'nfts',
  Activity = 'activity',
}

const PORTFOLIO_TAB_VALUES = new Set<string>(Object.values(PortfolioTab))

export function isPortfolioTab(value: string | undefined): value is PortfolioTab {
  return Boolean(value && PORTFOLIO_TAB_VALUES.has(value))
}
