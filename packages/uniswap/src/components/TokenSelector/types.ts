import { OnchainItemListType, TokenSelectorItemTypes } from 'uniswap/src/components/lists/items/types'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FiatNumberType } from 'utilities/src/format/types'

export type OnSelectCurrency = (
  currency: CurrencyInfo,
  section: OnchainItemSection<TokenSelectorItemTypes>,
  index: number,
) => void

export enum OnchainItemSectionName {
  SearchResults = 'searchResults',
  RecentSearches = 'recentSearches',

  YourTokens = 'yourTokens',
  TrendingTokens = 'trendingTokens',
  FavoriteTokens = 'favoriteTokens',
  SuggestedTokens = 'suggestedTokens',
  BridgingTokens = 'bridgingTokens',
  OtherChainsTokens = 'otherNetworksTokens',

  TrendingPools = 'trendingPools',
  Tokens = 'tokens',
  Pools = 'pools',
  // add wallets & NFT collections
}

export type OnchainItemSection<T extends OnchainItemListType> = {
  data: T[]
  sectionKey: OnchainItemSectionName
  name?: string
  rightElement?: JSX.Element
  endElement?: JSX.Element
}

export type TokenSectionsHookProps = {
  activeAccountAddress?: string
  chainFilter: UniverseChainId | null
  oppositeSelectedToken?: TradeableAsset
  isKeyboardOpen?: boolean
}

export type ConvertFiatAmountFormattedCallback = (
  fromAmount: Maybe<string | number>,
  numberType: FiatNumberType,
  placeholder?: string | undefined,
) => string

export enum TokenSelectorFlow {
  Swap = 0,
  Send = 1,
}
