export enum SearchTab {
  All = 'All',
  Tokens = 'Tokens',
  Pools = 'Pools',
  Wallets = 'Wallets',
  NFTCollections = 'NFTs',
}

export const WEB_SEARCH_TABS = [SearchTab.All, SearchTab.Tokens, SearchTab.Pools]
export const MOBILE_SEARCH_TABS = [SearchTab.All, SearchTab.Tokens, SearchTab.Wallets, SearchTab.NFTCollections]
