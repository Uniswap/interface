import { ReactNode } from 'react'
import { ItemType, TokenSelectorItemTypes } from 'uniswap/src/components/lists/types'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FiatNumberType } from 'utilities/src/format/types'

export type OnSelectCurrency = (
  currency: CurrencyInfo,
  section: TokenSection<TokenSelectorItemTypes>,
  index: number,
) => void

export enum TokenOptionSection {
  YourTokens = 'yourTokens',
  PopularTokens = 'popularTokens',
  RecentTokens = 'recentTokens',
  FavoriteTokens = 'favoriteTokens',
  SearchResults = 'searchResults',
  SuggestedTokens = 'suggestedTokens',
  BridgingTokens = 'bridgingTokens',
}

export type TokenSection<T extends ItemType> = {
  data: T[]
  sectionKey: TokenOptionSection
  name?: string
  rightElement?: JSX.Element
  endElement?: JSX.Element
}

export type TokenSectionsHookProps = {
  activeAccountAddress?: string
  chainFilter: UniverseChainId | null
  input?: TradeableAsset
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

export interface TokenItemWrapperProps {
  children: ReactNode
  tokenInfo: {
    address: string
    chain: number
    isNative: boolean
  }
}
