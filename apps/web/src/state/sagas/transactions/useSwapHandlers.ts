import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback, useMemo } from 'react'
import { useSwapCallback } from 'state/sagas/transactions/swapSaga'
import { useWrapCallback } from 'state/sagas/transactions/wrapSaga'
import {
  ExecuteSwapCallback,
  ExecuteSwapParams,
  PrepareSwapCallback,
  SwapHandlers,
} from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import { isWrap } from 'uniswap/src/features/transactions/swap/utils/routing'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'

/**
 * Validates that all required parameters for a wrap transaction are present.
 * @throws {Error} If inputCurrencyAmount or wrapType is missing
 * @returns Validated wrap parameters
 */
export function validateWrapParams(params: ExecuteSwapParams): {
  inputCurrencyAmount: CurrencyAmount<Currency>
  wrapType: WrapType.Wrap | WrapType.Unwrap
} {
  if (!params.inputCurrencyAmount || !params.wrapType) {
    throw new Error('Missing required wrap parameters')
  }
  return {
    inputCurrencyAmount: params.inputCurrencyAmount,
    wrapType: params.wrapType,
  }
}

/**
 * Web implementation of SwapHandlers that routes between swap and wrap callbacks.
 * This provides a unified interface without implementing pre-signing (web doesn't need it).
 */
export function useSwapHandlers(): SwapHandlers {
  const swapCallback = useSwapCallback()
  const wrapCallback = useWrapCallback()

  // Web doesn't pre-sign transactions, so this is a no-op
  const prepareAndSign: PrepareSwapCallback = useCallback(async () => {}, [])

  // Execute routes to the appropriate callback based on transaction type
  const execute: ExecuteSwapCallback = useCallback(
    async (params) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[execute] useSwapHandlers execute called with params:', params)
        console.log('[execute] useSwapHandlers - Detailed swapTxContext:', {
          routing: params.swapTxContext?.routing,
          hasTxRequests: !!params.swapTxContext?.txRequests,
          txRequestCount: params.swapTxContext?.txRequests?.length || 0,
          txRequests: params.swapTxContext?.txRequests?.map((tx, idx) => ({
            index: idx,
            to: tx.to,
            data: tx.data?.substring(0, 20) + '...',
            value: tx.value?.toString(),
            gasLimit: tx.gasLimit?.toString(),
            chainId: tx.chainId,
          })),
          hasTrade: !!params.swapTxContext?.trade,
          trade: params.swapTxContext?.trade ? {
            routing: params.swapTxContext.trade.routing,
            inputAmount: params.swapTxContext.trade.inputAmount?.toExact(),
            outputAmount: params.swapTxContext.trade.outputAmount?.toExact(),
            deadline: params.swapTxContext.trade.deadline,
            deadlineDate: params.swapTxContext.trade.deadline ? new Date(params.swapTxContext.trade.deadline * 1000).toLocaleString('zh-CN') : undefined,
          } : undefined,
          includesDelegation: params.swapTxContext?.includesDelegation,
          hasSwapRequestArgs: 'swapRequestArgs' in (params.swapTxContext || {}),
          swapRequestArgs: params.swapTxContext?.swapRequestArgs ? {
            deadline: params.swapTxContext.swapRequestArgs.deadline,
            deadlineDate: params.swapTxContext.swapRequestArgs.deadline ? new Date(params.swapTxContext.swapRequestArgs.deadline * 1000).toLocaleString('zh-CN') : undefined,
            hasQuote: !!params.swapTxContext.swapRequestArgs.quote,
            simulateTransaction: params.swapTxContext.swapRequestArgs.simulateTransaction,
            allKeys: Object.keys(params.swapTxContext.swapRequestArgs),
            fullSwapRequestArgs: params.swapTxContext.swapRequestArgs,
          } : 'swapRequestArgs is undefined',
          swapTxContextKeys: params.swapTxContext ? Object.keys(params.swapTxContext) : [],
        })
      }

      const {
        account,
        swapTxContext,
        currencyInAmountUSD,
        currencyOutAmountUSD,
        isAutoSlippage,
        presetPercentage,
        preselectAsset,
        onSuccess,
        onFailure,
        onPending,
        txId,
        setCurrentStep,
        setSteps,
        isFiatInputMode,
      } = params

      // Route to appropriate callback based on transaction type
      if (isWrap(swapTxContext)) {
        // Handle wrap transactions
        try {
          const { inputCurrencyAmount, wrapType } = validateWrapParams(params)
          const txRequest = swapTxContext.txRequests[0]

          wrapCallback({
            account,
            inputCurrencyAmount,
            txRequest,
            txId,
            wrapType,
            gasEstimate: swapTxContext.gasFeeEstimation.wrapEstimate,
            onSuccess,
            onFailure,
          })
        } catch (error) {
          onFailure(error instanceof Error ? error : new Error('Unknown validation error'))
          return
        }
      } else {
        // Handle regular swap transactions
        try {
        swapCallback({
          account,
          swapTxContext,
          currencyInAmountUSD,
          currencyOutAmountUSD,
          isAutoSlippage,
          presetPercentage,
          preselectAsset,
          onSuccess,
          onFailure,
          onPending,
          txId,
          setCurrentStep,
          setSteps,
          isFiatInputMode,
          includesDelegation: swapTxContext.includesDelegation,
        })
        } catch (error) {
          onFailure(error instanceof Error ? error : new Error(String(error)))
        }
      }
    },
    [swapCallback, wrapCallback],
  )

  return useMemo(
    () => ({
      prepareAndSign,
      execute,
    }),
    [prepareAndSign, execute],
  )
}
