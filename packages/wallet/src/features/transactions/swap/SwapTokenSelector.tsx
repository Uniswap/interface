import { Currency } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import { Keyboard, LayoutAnimation } from 'react-native'
import { useSelector } from 'react-redux'
import { isWeb } from 'ui/src'
import {
  TokenSelector,
  TokenSelectorModal,
  TokenSelectorProps,
  TokenSelectorVariation,
} from 'uniswap/src/components/TokenSelector/TokenSelector'
import { flowToModalName } from 'uniswap/src/components/TokenSelector/flowToModalName'
import {
  useCommonTokensOptions,
  useFilterCallbacks,
  usePopularTokensOptions,
  usePortfolioTokenOptions,
  useTokenSectionsForSearchResults,
} from 'uniswap/src/components/TokenSelector/hooks'
import { AssetType, TradeableAsset } from 'uniswap/src/entities/assets'
import { SearchContext } from 'uniswap/src/features/search/SearchContext'
import { TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CurrencyField } from 'uniswap/src/features/transactions/transactionState/types'
import { TokenSelectorFlow } from 'uniswap/src/features/transactions/transfer/types'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import {
  useAddToSearchHistory,
  useFavoriteTokensOptions,
  useTokenSectionsForEmptySearch,
} from 'wallet/src/components/TokenSelector/hooks'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { usePortfolioValueModifiers } from 'wallet/src/features/dataApi/balances'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { selectSearchHistory } from 'wallet/src/features/search/selectSearchHistory'
import { useTokenWarningDismissed } from 'wallet/src/features/tokens/safetyHooks'
import { SwapFormState, useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { useTransactionModalContext } from 'wallet/src/features/transactions/contexts/TransactionModalContext'

export function SwapTokenSelector(): JSX.Element {
  const { account } = useTransactionModalContext()
  const swapContext = useSwapFormContext()
  const { updateSwapForm, exactCurrencyField, selectingCurrencyField, output, input } = swapContext
  const { navigateToBuyOrReceiveWithEmptyWallet } = useWalletNavigation()
  const activeAccountAddress = account.address
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const valueModifiers = usePortfolioValueModifiers(activeAccountAddress)
  const { registerSearch } = useAddToSearchHistory()
  const searchHistory = useSelector(selectSearchHistory)

  if (!selectingCurrencyField) {
    throw new Error('TokenSelector rendered without `selectingCurrencyField`')
  }

  const onHideTokenSelector = useCallback(() => {
    updateSwapForm({ selectingCurrencyField: undefined })
  }, [updateSwapForm])

  const onSelectCurrency = useCallback(
    (currency: Currency, field: CurrencyField, context: SearchContext) => {
      const tradeableAsset: TradeableAsset = {
        address: currencyAddress(currency),
        chainId: currency.chainId,
        type: AssetType.Currency,
      }

      const newState: Partial<SwapFormState> = {}

      const otherField = field === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
      const otherFieldTradeableAsset = field === CurrencyField.INPUT ? output : input

      // We need to parse this, because one value is 'Currency' type, other is 'TradeableAsset', so shallowCompare on objects wont work
      const chainsAreEqual = currency.chainId === otherFieldTradeableAsset?.chainId
      const addressesAreEqual = currencyAddress(currency) === otherFieldTradeableAsset?.address

      // swap order if tokens are the same
      if (chainsAreEqual && addressesAreEqual) {
        const previouslySelectedTradableAsset = field === CurrencyField.INPUT ? input : output
        // Given that we're swapping the order of tokens, we should also swap the `exactCurrencyField` and update the `focusOnCurrencyField` to make sure the correct input field is focused.
        newState.exactCurrencyField =
          exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
        newState.focusOnCurrencyField = newState.exactCurrencyField
        newState[otherField] = previouslySelectedTradableAsset
      }

      // reset the other field if network changed
      if (currency.chainId !== otherFieldTradeableAsset?.chainId) {
        newState.exactCurrencyField = field
        newState[otherField] = undefined
      }

      newState[field] = tradeableAsset

      updateSwapForm(newState)

      sendAnalyticsEvent(WalletEventName.TokenSelected, {
        name: currency.name,
        address: currencyAddress(currency),
        chain: currency.chainId,
        modal: flowToModalName(TokenSelectorFlow.Swap),
        field,
        category: context.category,
        position: context.position,
        suggestion_count: context.suggestionCount,
        query: context.query,
      })

      // Hide screen when done selecting.
      onHideTokenSelector()
    },
    [exactCurrencyField, input, onHideTokenSelector, output, updateSwapForm],
  )

  const props: TokenSelectorProps = {
    // we need to filter tokens using the chainId of the *other* currency
    activeAccountAddress,
    chainId: selectingCurrencyField === CurrencyField.INPUT ? output?.chainId : input?.chainId,
    currencyField: selectingCurrencyField,
    flow: TokenSelectorFlow.Swap,
    variation:
      selectingCurrencyField === CurrencyField.INPUT
        ? TokenSelectorVariation.BalancesAndPopular
        : TokenSelectorVariation.SuggestedAndFavoritesAndPopular,
    valueModifiers,
    searchHistory: searchHistory as TokenSearchResult[],
    onClose: onHideTokenSelector,
    onDismiss: () => Keyboard.dismiss(),
    onPressAnimation: () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut),
    onSelectCurrency,
    useCommonTokensOptionsHook: useCommonTokensOptions,
    useFavoriteTokensOptionsHook: useFavoriteTokensOptions,
    usePopularTokensOptionsHook: usePopularTokensOptions,
    usePortfolioTokenOptionsHook: usePortfolioTokenOptions,
    useTokenSectionsForEmptySearchHook: useTokenSectionsForEmptySearch,
    useTokenSectionsForSearchResultsHook: useTokenSectionsForSearchResults,
    useTokenWarningDismissedHook: useTokenWarningDismissed,
    useFilterCallbacksHook: useFilterCallbacks,
    navigateToBuyOrReceiveWithEmptyWalletCallback: navigateToBuyOrReceiveWithEmptyWallet,
    convertFiatAmountFormattedCallback: convertFiatAmountFormatted,
    formatNumberOrStringCallback: formatNumberOrString,
    addToSearchHistoryCallback: registerSearch,
  }
  return isWeb ? <TokenSelector {...props} /> : <TokenSelectorModal {...props} />
}
