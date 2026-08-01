import { useTrace } from '@uniswap/analytics'
import { SharedQueryClient, TradingApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback } from 'react'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { getDisplayedPriceSource } from 'uniswap/src/features/prices/getDisplayedPriceSource'
import { finalizeTransaction, updateTransaction } from 'uniswap/src/features/transactions/slice'
import {
  extractPlanFieldsFromTypeInfo,
  extractTransactionTypeInfoAttribute,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isFinalizedTx } from 'uniswap/src/features/transactions/types/utils'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import type { UniswapXOrderUpdate } from '~/state/activity/types'
import { useAppDispatch } from '~/state/hooks'
import { maybeAddEarnSwapUpsellPopup } from '~/state/popups/earnSwapUpsell'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import { logUniswapXSwapFinalized } from '~/tracing/swapFlowLoggers'

interface HandleUniswapXActivityUpdateParams {
  activity: UniswapXOrderUpdate
  popupDismissalTime: number
}

export function useHandleUniswapXActivityUpdate(): (params: HandleUniswapXActivityUpdateParams) => void {
  const dispatch = useAppDispatch()
  const analyticsContext = useTrace()
  const isCentralizedPricesEnabled = useFeatureFlag(FeatureFlags.CentralizedPrices)
  const isEarnEnabled = useIsEarnEnabled()

  return useCallback(
    ({ activity, popupDismissalTime }: HandleUniswapXActivityUpdateParams): void => {
      const { original, update } = activity

      // Always update the transaction first to ensure all fields are updated
      dispatch(updateTransaction(update))

      // Then finalize if it's a final status (for analytics and other side effects)
      if (isFinalizedTx(update)) {
        dispatch(finalizeTransaction(update))
      }

      // Add popup based on activity status
      if (update.status === TransactionStatus.Success && update.hash) {
        popupRegistry.addPopup(
          {
            type: PopupType.Transaction,
            hash: update.hash,
          },
          update.hash,
          popupDismissalTime,
        )

        maybeAddEarnSwapUpsellPopup({
          isEarnEnabled,
          status: update.status,
          typeInfo: update.typeInfo,
          transactionId: update.id,
          swapPopupKey: update.hash,
        })
      } else if (original.status !== update.status && original.orderHash) {
        popupRegistry.addPopup(
          {
            type: PopupType.Order,
            orderHash: original.orderHash,
          },
          original.orderHash,
          popupDismissalTime,
        )
      }

      // Log status to analytics
      if (
        original.orderHash &&
        ((update.status === TransactionStatus.Success && original.routing !== TradingApi.Routing.DUTCH_LIMIT) ||
          update.status === TransactionStatus.Canceled ||
          update.status === TransactionStatus.Expired)
      ) {
        // Log successful non-limit orders (for swap metrics) and all cancelled/expired orders
        const inputCurrencyId = extractTransactionTypeInfoAttribute(original.typeInfo, 'inputCurrencyId')
        const inputAddress = inputCurrencyId?.includes('-') ? currencyIdToAddress(inputCurrencyId) : undefined
        logUniswapXSwapFinalized({
          id: original.id,
          hash: update.hash,
          orderHash: original.orderHash,
          chainId: activity.chainId,
          analyticsContext,
          routing: original.routing,
          status: update.status,
          swapStartTimestamp: extractTransactionTypeInfoAttribute(original.typeInfo, 'swapStartTimestamp'),
          planAnalytics: extractPlanFieldsFromTypeInfo(original.typeInfo),
          transactedUSDValue: extractTransactionTypeInfoAttribute(original.typeInfo, 'transactedUSDValue'),
          rwaAnalytics: {
            market_closed: extractTransactionTypeInfoAttribute(original.typeInfo, 'marketClosed'),
            price_warning: extractTransactionTypeInfoAttribute(original.typeInfo, 'priceWarning'),
            token_in_stocks: extractTransactionTypeInfoAttribute(original.typeInfo, 'tokenInStocks'),
            token_out_stocks: extractTransactionTypeInfoAttribute(original.typeInfo, 'tokenOutStocks'),
          },
          priceSource: inputAddress
            ? getDisplayedPriceSource({
                isCentralizedPricesEnabled,
                surface: 'usdc',
                chainId: activity.chainId,
                address: inputAddress,
                queryClient: SharedQueryClient,
              })
            : undefined,
        })
      }
    },
    [dispatch, analyticsContext, isCentralizedPricesEnabled, isEarnEnabled],
  )
}
