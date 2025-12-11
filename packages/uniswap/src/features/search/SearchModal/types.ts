export enum SearchTab {
  All = 'All',
  Tokens = 'Tokens',
  Pools = 'Pools',
  Wallets = 'Wallets',
  NFTCollections = 'NFTs',
}

export const WEB_SEARCH_TABS = [SearchTab.All, SearchTab.Tokens, SearchTab.Pools]
export const WEB_SEARCH_TABS_WITH_WALLETS = [SearchTab.All, SearchTab.Tokens, SearchTab.Pools, SearchTab.Wallets]
export const MOBILE_SEARCH_TABS = [SearchTab.All, SearchTab.Tokens, SearchTab.Wallets, SearchTab.NFTCollections]
