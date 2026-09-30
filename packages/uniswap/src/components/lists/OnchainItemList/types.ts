import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'

export enum OnchainItemSectionName {
  SearchResults = 'searchResults',
  RecentSearches = 'recentSearches',

  YourTokens = 'yourTokens',
  HiddenTokens = 'hiddenTokens',
  TrendingTokens = 'trendingTokens',
  FavoriteTokens = 'favoriteTokens',
  SuggestedTokens = 'suggestedTokens',
  Stocks = 'stocks',
  Category = 'category',
  BridgingTokens = 'bridgingTokens',
  OtherChainsTokens = 'otherNetworksTokens',

  Earn = 'earn',
  Tokens = 'tokens',
  Pools = 'pools',
  TrendingPools = 'trendingPools',
  Wallets = 'wallets',
  FavoriteWallets = 'favoriteWallets',
  Auctions = 'auctions',
  TopAuctions = 'topAuctions',
}

export type OnchainItemSection<T extends OnchainItemListOption> = {
  data: T[]
  sectionKey: OnchainItemSectionName
  sectionId?: string
  name?: string
  categoryId?: string
  onPress?: () => void
  rightElement?: JSX.Element
  endElement?: JSX.Element
  /** Rendered as its own non-focusable row after the section's items. */
  footerElement?: JSX.Element
  sectionHeader?: JSX.Element
  sectionHeaderHeight?: number
  /** Overrides the default section icon when provided. */
  icon?: JSX.Element
}
