import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback, useMemo } from 'react'
import {
  createWrapTransactionStep,
  createWrapTransactionStepWalletCall,
  type WrapTransactionStep,
  type WrapTransactionStepWalletCall,
} from 'uniswap/src/features/transactions/steps/wrap'
import {
  ExecuteSwapCallback,
  ExecuteSwapParams,
  PrepareSwapCallback,
  SwapHandlers,
} from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import type { WrapSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isWrap } from 'uniswap/src/features/transactions/swap/utils/routing'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { useSwapCallback } from '~/features/Swap/hooks/useSwapHandlers/useSwapSagaCallback'
import { useWrapCallback } from '~/state/sagas/transactions/wrapSaga'

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
 * Picks the wrap step variant based on whether the quote is sponsored:
 * - Sponsored (quote.sponsorshipInfo.sponsored + paymasterService present): emit a
 *   wallet-call step so the saga routes through `wallet_sendCalls` with the paymaster
 *   capability, mirroring the sponsored classic/bridge swap path.
 * - Otherwise: emit the existing single-tx step.
 */
export function buildWrapStep({
  swapTxContext,
  inputCurrencyAmount,
}: {
  swapTxContext: WrapSwapTxAndGasInfo
  inputCurrencyAmount: CurrencyAmount<Currency>
}): WrapTransactionStep | WrapTransactionStepWalletCall | undefined {
  const { txRequests, paymasterService, trade } = swapTxContext

  if (!txRequests || txRequests.length === 0) {
    return undefined
  }

  const isSponsored = Boolean(trade.quote.sponsorshipInfo?.sponsored && paymasterService)
  if (isSponsored) {
    return createWrapTransactionStepWalletCall({ txRequests, inputAmount: inputCurrencyAmount, paymasterService })
  }

  return createWrapTransactionStep(txRequests[0], inputCurrencyAmount)
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
      const {
        address,
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
        onClearForm,
      } = params

      // Route to appropriate callback based on transaction type
      if (isWrap(swapTxContext)) {
        // Handle wrap transactions
        try {
          const { inputCurrencyAmount, wrapType } = validateWrapParams(params)

          const step = buildWrapStep({ swapTxContext, inputCurrencyAmount })
          if (!step) {
            onFailure(new Error('Missing wrap transaction request'))
            return
          }

          wrapCallback({
            address,
            inputCurrencyAmount,
            step,
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
        swapCallback({
          onClearForm,
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
