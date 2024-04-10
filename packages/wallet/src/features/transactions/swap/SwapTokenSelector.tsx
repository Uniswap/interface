import { Currency } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import { isWeb } from 'ui/src'
import { flowToModalName } from 'wallet/src/components/TokenSelector/flowToModalName'
import {
  TokenSelector,
  TokenSelectorModal,
  TokenSelectorProps,
  TokenSelectorVariation,
} from 'wallet/src/components/TokenSelector/TokenSelector'
import { AssetType, TradeableAsset } from 'wallet/src/entities/assets'
import { SearchContext } from 'wallet/src/features/search/SearchContext'
import {
  SwapFormState,
  useSwapFormContext,
} from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { TokenSelectorFlow } from 'wallet/src/features/transactions/transfer/types'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { WalletEventName } from 'wallet/src/telemetry/constants'
import { currencyAddress } from 'wallet/src/utils/currencyId'

export function SwapTokenSelector(): JSX.Element {
  const swapContext = useSwapFormContext()
  const { updateSwapForm, selectingCurrencyField, output, input } = swapContext

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
      const otherFieldTradeableAsset = swapContext[otherField]

      // We need to parse this, because one value is 'Currency' type, other is 'TradeableAsset', so shallowCompare on objects wont work
      const chainsAreEqual = currency.chainId === otherFieldTradeableAsset?.chainId
      const addressesAreEqual = currencyAddress(currency) === otherFieldTradeableAsset?.address

      // swap order if tokens are the same
      if (chainsAreEqual && addressesAreEqual) {
        newState.exactCurrencyField = field
        newState[otherField] = swapContext[field]
      }

      // reset the other field if network changed
      if (currency.chainId !== otherFieldTradeableAsset?.chainId) {
        newState.exactCurrencyField = field
        newState[otherField] = undefined
      }

      newState[field] = tradeableAsset

      updateSwapForm(newState)

      sendWalletAnalyticsEvent(WalletEventName.TokenSelected, {
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
    [onHideTokenSelector, swapContext, updateSwapForm]
  )

  const props: TokenSelectorProps = {
    // we need to filter tokens using the chainId of the *other* currency
    chainId: selectingCurrencyField === CurrencyField.INPUT ? output?.chainId : input?.chainId,
    currencyField: selectingCurrencyField,
    flow: TokenSelectorFlow.Swap,
    variation:
      selectingCurrencyField === CurrencyField.INPUT
        ? TokenSelectorVariation.BalancesAndPopular
        : TokenSelectorVariation.SuggestedAndFavoritesAndPopular,
    onClose: onHideTokenSelector,
    onSelectCurrency,
  }
  return isWeb ? <TokenSelector {...props} /> : <TokenSelectorModal {...props} />
}
