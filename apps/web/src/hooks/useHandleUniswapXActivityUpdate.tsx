import { useTrace } from '@uniswap/analytics'
import { TradingApi } from '@universe/api'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { useCallback } from 'react'
import type { UniswapXOrderUpdate } from 'state/activity/types'
import { useAppDispatch } from 'state/hooks'
import { logUniswapXSwapFinalized } from 'tracing/swapFlowLoggers'
import { finalizeTransaction, updateTransaction } from 'uniswap/src/features/transactions/slice'
import {
  extractTransactionTypeInfoAttribute,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isFinalizedTx } from 'uniswap/src/features/transactions/types/utils'

interface HandleUniswapXActivityUpdateParams {
  activity: UniswapXOrderUpdate
  popupDismissalTime: number
}

export function useHandleUniswapXActivityUpdate(): (params: HandleUniswapXActivityUpdateParams) => void {
  const dispatch = useAppDispatch()
  const analyticsContext = useTrace()

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
        logUniswapXSwapFinalized({
          id: original.id,
          hash: update.hash,
          orderHash: original.orderHash,
          chainId: activity.chainId,
          analyticsContext,
          routing: original.routing,
          status: update.status,
          isFinalStep: extractTransactionTypeInfoAttribute(original.typeInfo, 'isFinalStep'),
          swapStartTimestamp: extractTransactionTypeInfoAttribute(original.typeInfo, 'swapStartTimestamp'),
        })
      }
    },
    [dispatch, analyticsContext],
  )
}
