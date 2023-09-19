import { Currency } from '@uniswap/sdk-core'
import React, { useCallback } from 'react'
import { SearchContext } from 'src/components/explore/search/SearchResultsSection'
import {
  flowToModalName,
  TokenSelectorFlow,
  TokenSelectorModal,
  TokenSelectorVariation,
} from 'src/components/TokenSelector/TokenSelector'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { AssetType } from 'wallet/src/entities/assets'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { currencyAddress } from 'wallet/src/utils/currencyId'
import { useSwapContext } from './SwapContext'

export function TokenSelector(): JSX.Element {
  const { updateSwapForm, selectingCurrencyField, output, input } = useSwapContext()

  if (!selectingCurrencyField) {
    throw new Error('TokenSelector rendered without `selectingCurrencyField`')
  }

  const onHideTokenSelector = useCallback(() => {
    updateSwapForm({ selectingCurrencyField: undefined })
  }, [updateSwapForm])

  const onSelectCurrency = useCallback(
    (currency: Currency, field: CurrencyField, context: SearchContext) => {
      updateSwapForm({
        [field]: {
          address: currencyAddress(currency),
          chainId: currency.chainId,
          type: AssetType.Currency,
        },
      })

      sendMobileAnalyticsEvent(MobileEventName.TokenSelected, {
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
    [onHideTokenSelector, updateSwapForm]
  )

  return (
    <TokenSelectorModal
      chainId={selectingCurrencyField === CurrencyField.INPUT ? input?.chainId : output?.chainId}
      currencyField={selectingCurrencyField}
      flow={TokenSelectorFlow.Swap}
      variation={
        selectingCurrencyField === CurrencyField.INPUT
          ? TokenSelectorVariation.BalancesAndPopular
          : TokenSelectorVariation.SuggestedAndFavoritesAndPopular
      }
      onClose={onHideTokenSelector}
      onSelectCurrency={onSelectCurrency}
    />
  )
}
