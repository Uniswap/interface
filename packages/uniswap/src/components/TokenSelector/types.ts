import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { FiatNumberType } from 'utilities/src/format/types'

export type TokenOption = {
  currencyInfo: CurrencyInfo
  quantity: number | null // float representation of balance, returned by data-api
  balanceUSD: Maybe<number>
  isUnsupported?: boolean
}

export type OnSelectCurrency = (currency: CurrencyInfo, section: TokenSection, index: number) => void

export enum TokenOptionSection {
  YourTokens = 'yourTokens',
  PopularTokens = 'popularTokens',
  RecentTokens = 'recentTokens',
  FavoriteTokens = 'favoriteTokens',
  SearchResults = 'searchResults',
  SuggestedTokens = 'suggestedTokens',
  BridgingTokens = 'bridgingTokens',
}

export type TokenSection = {
  data: TokenOption[] | TokenOption[][]
  sectionKey: TokenOptionSection
  rightElement?: JSX.Element
}

export type TokenSectionsHookProps = {
  activeAccountAddress?: string
  chainFilter: UniverseChainId | null
  isKeyboardOpen?: boolean
}

export type ConvertFiatAmountFormattedCallback = (
  fromAmount: Maybe<string | number>,
  numberType: FiatNumberType,
  placeholder?: string | undefined,
) => string

export enum TokenSelectorFlow {
  Swap,
  Send,
}
