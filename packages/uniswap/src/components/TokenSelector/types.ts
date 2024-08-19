import { PortfolioValueModifier } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { TokenSelectorFlow } from 'uniswap/src/features/transactions/transfer/types'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { FiatNumberType } from 'utilities/src/format/types'

export type TokenOption = {
  currencyInfo: CurrencyInfo
  quantity: number | null // float representation of balance, returned by data-api
  balanceUSD: Maybe<number>
}

export type TokenOptionsHookType = (
  address: string,
  chainFilter: UniverseChainId | null,
  valueModifiers?: PortfolioValueModifier[],
  searchFilter?: string,
) => GqlResult<TokenOption[] | undefined>

export type TokenOptionsWithChainFilterHookType = (
  address: string,
  chainFilter: UniverseChainId,
  valueModifiers?: PortfolioValueModifier[],
  searchFilter?: string,
) => GqlResult<TokenOption[] | undefined>

export type TokenOptionsWithBalanceOnlySearchHookType = (
  address: string,
  chainFilter: UniverseChainId | null,
  searchFilter: string | null,
  isBalancesOnlySearch: boolean,
  valueModifiers?: PortfolioValueModifier[],
) => GqlResult<TokenSection[]>

export type TokenSectionsForEmptySearchHookType = (chainFilter: UniverseChainId | null) => GqlResult<TokenSection[]>

export type OnSelectCurrency = (currency: CurrencyInfo, section: TokenSection, index: number) => void

export enum TokenOptionSection {
  YourTokens = 'yourTokens',
  PopularTokens = 'popularTokens',
  RecentTokens = 'recentTokens',
  FavoriteTokens = 'favoriteTokens',
  SearchResults = 'searchResults',
  SuggestedTokens = 'suggestedTokens',
}

export type TokenSection = {
  data: TokenOption[] | TokenOption[][]
  sectionKey: TokenOptionSection
  rightElement?: JSX.Element
}

export type TokenSelectorListSections = TokenSection[]

export type TokenWarningDismissedHook = (currencyId: Maybe<string>) => {
  tokenWarningDismissed: boolean
  dismissWarningCallback: () => void
}

export type TokenSectionsForSwap = {
  activeAccountAddress: string
  chainFilter: UniverseChainId | null
  searchHistory?: TokenSearchResult[]
  valueModifiers?: PortfolioValueModifier[]
  useFavoriteTokensOptionsHook: TokenOptionsHookType
  usePopularTokensOptionsHook: TokenOptionsWithChainFilterHookType
  usePortfolioTokenOptionsHook: TokenOptionsHookType
}

export type TokenSectionsForSwapInput = TokenSectionsForSwap

export type TokenSectionsForSwapOutput = TokenSectionsForSwap & {
  useCommonTokensOptionsHook: TokenOptionsWithChainFilterHookType
}

export type TokenSectionsForSend = Omit<
  TokenSectionsForSwap,
  'usePopularTokensOptionsHook' | 'useFavoriteTokensOptionsHook'
>

export type ConvertFiatAmountFormattedCallback = (
  fromAmount: Maybe<string | number>,
  numberType: FiatNumberType,
  placeholder?: string | undefined,
) => string

export type FilterCallbacksHookType = (
  chainId: UniverseChainId | null,
  flow: TokenSelectorFlow,
) => {
  chainFilter: UniverseChainId | null
  searchFilter: string | null
  onChangeChainFilter: (newChainFilter: UniverseChainId | null) => void
  onClearSearchFilter: () => void
  onChangeText: (newSearchFilter: string) => void
}
