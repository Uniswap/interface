import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import { flowToModalName } from 'wallet/src/components/TokenSelector/flowToModalName'
import { AssetType } from 'wallet/src/entities/assets'
import { SearchContext } from 'wallet/src/features/search/SearchContext'
import { transactionStateActions } from 'wallet/src/features/transactions/transactionState/transactionState'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { TokenSelectorFlow } from 'wallet/src/features/transactions/transfer/types'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { WalletEventName } from 'wallet/src/telemetry/constants'
import { currencyAddress } from 'wallet/src/utils/currencyId'

export function useTokenSelectorActionHandlers(
  dispatch: React.Dispatch<AnyAction>,
  flow: TokenSelectorFlow
): {
  onShowTokenSelector: (field: CurrencyField) => void
  onHideTokenSelector: () => void
  onSelectCurrency: (currency: Currency, field: CurrencyField, context: SearchContext) => void
} {
  const onShowTokenSelector = useCallback(
    (field: CurrencyField) => dispatch(transactionStateActions.showTokenSelector(field)),
    [dispatch]
  )

  const onHideTokenSelector = useCallback(
    () => dispatch(transactionStateActions.showTokenSelector(undefined)),
    [dispatch]
  )

  const onSelectCurrency = useCallback(
    (currency: Currency, field: CurrencyField, context: SearchContext) => {
      dispatch(
        transactionStateActions.selectCurrency({
          field,
          tradeableAsset: {
            address: currencyAddress(currency),
            chainId: currency.chainId,
            type: AssetType.Currency,
          },
        })
      )

      // log event that a currency was selected
      sendWalletAnalyticsEvent(WalletEventName.TokenSelected, {
        name: currency.name,
        address: currencyAddress(currency),
        chain: currency.chainId,
        modal: flowToModalName(flow),
        field,
        category: context.category,
        position: context.position,
        suggestion_count: context.suggestionCount,
        query: context.query,
      })

      // hide screen when done selecting
      onHideTokenSelector()
    },
    [dispatch, flow, onHideTokenSelector]
  )
  return { onSelectCurrency, onShowTokenSelector, onHideTokenSelector }
}
