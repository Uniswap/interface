import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'

export enum OnchainItemSectionName {
  SearchResults = 'searchResults',
  RecentSearches = 'recentSearches',

  YourTokens = 'yourTokens',
  TrendingTokens = 'trendingTokens',
  FavoriteTokens = 'favoriteTokens',
  SuggestedTokens = 'suggestedTokens',
  BridgingTokens = 'bridgingTokens',
  OtherChainsTokens = 'otherNetworksTokens',

  Tokens = 'tokens',
  Pools = 'pools',
  TrendingPools = 'trendingPools',
  Wallets = 'wallets',
  FavoriteWallets = 'favoriteWallets',
  NFTCollections = 'nftCollections',
  PopularNFTCollections = 'popularNFTCollections',
}

export type OnchainItemSection<T extends OnchainItemListOption> = {
  data: T[]
  sectionKey: OnchainItemSectionName
  name?: string
  rightElement?: JSX.Element
  endElement?: JSX.Element
}
