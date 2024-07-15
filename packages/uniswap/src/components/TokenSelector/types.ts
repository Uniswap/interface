import { GqlResult } from 'uniswap/src/data/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
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
  searchFilter?: string,
) => GqlResult<TokenOption[] | undefined>

export type TokenOptionsWithChainFilterHookType = (
  address: string,
  chainFilter: UniverseChainId,
  searchFilter?: string,
) => GqlResult<TokenOption[] | undefined>

export type TokenOptionsWithBalanceOnlySearchHookType = (
  chainFilter: UniverseChainId | null,
  searchFilter: string | null,
  isBalancesOnlySearch: boolean,
) => GqlResult<TokenSection[]>

export type OnSelectCurrency = (
  currency: CurrencyInfo,
  section: SuggestedTokenSection | TokenSection,
  index: number,
) => void

export type TokenSection = {
  title: string
  data: TokenOption[]
  rightElement?: JSX.Element
}

export type SuggestedTokenSection = {
  title: string
  data: TokenOption[][]
  rightElement?: JSX.Element
}

export type TokenSelectorListSections = Array<SuggestedTokenSection | TokenSection>

export type TokenWarningDismissedHook = (currencyId: Maybe<string>) => {
  tokenWarningDismissed: boolean
  dismissWarningCallback: () => void
}

export type TokenSectionsForSwap = {
  activeAccountAddress: string
  chainFilter: UniverseChainId | null
  usePopularTokensOptionsHook: (address: string, chainFilter: UniverseChainId) => GqlResult<TokenOption[] | undefined>
  usePortfolioTokenOptionsHook: (
    address: string,
    chainFilter: UniverseChainId | null,
    searchFilter?: string | undefined,
  ) => GqlResult<TokenOption[] | undefined>
}

export type TokenSectionsForSwapInput = TokenSectionsForSwap

export type TokenSectionsForSwapOutput = Omit<TokenSectionsForSwap, 'usePortfolioTokenOptionsHook'> & {
  useFavoriteTokensOptionsHook: (
    address: string,
    chainFilter: UniverseChainId | null,
  ) => GqlResult<TokenOption[] | undefined>
  useCommonTokensOptionsHook: (
    address: string,
    chainFilter: UniverseChainId | null,
  ) => GqlResult<TokenOption[] | undefined>
}

export type TokenSectionsForSend = Omit<TokenSectionsForSwap, 'usePopularTokensOptionsHook'>

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
