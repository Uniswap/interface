import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import { AssetType } from 'uniswap/src/entities/assets'
import { SearchContext } from 'uniswap/src/features/search/SearchContext'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CurrencyField } from 'uniswap/src/features/transactions/transactionState/types'
import { TokenSelectorFlow } from 'uniswap/src/features/transactions/transfer/types'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import { flowToModalName } from 'wallet/src/components/TokenSelector/flowToModalName'
import { transactionStateActions } from 'wallet/src/features/transactions/transactionState/transactionState'

export function useTokenSelectorActionHandlers(
  dispatch: React.Dispatch<AnyAction>,
  flow: TokenSelectorFlow,
): {
  onShowTokenSelector: (field: CurrencyField) => void
  onHideTokenSelector: () => void
  onSelectCurrency: (currency: Currency, field: CurrencyField, context: SearchContext) => void
} {
  const onShowTokenSelector = useCallback(
    (field: CurrencyField) => dispatch(transactionStateActions.showTokenSelector(field)),
    [dispatch],
  )

  const onHideTokenSelector = useCallback(
    () => dispatch(transactionStateActions.showTokenSelector(undefined)),
    [dispatch],
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
        }),
      )

      // log event that a currency was selected
      sendAnalyticsEvent(WalletEventName.TokenSelected, {
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
    [dispatch, flow, onHideTokenSelector],
  )
  return { onSelectCurrency, onShowTokenSelector, onHideTokenSelector }
}
