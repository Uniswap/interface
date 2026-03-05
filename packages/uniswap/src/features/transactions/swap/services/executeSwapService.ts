import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import type { SwapTxStoreState } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/createSwapTxStore'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { SwapExecutionCallbacks } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import type {
  ExecuteSwapCallback,
  PrepareSwapCallback,
} from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

type ExecuteSwap = () => void

export interface ExecuteSwapService {
  executeSwap: ExecuteSwap
}

export type GetExecuteSwapService = (
  ctx: {
    getSwapTxContext: () => SwapTxAndGasInfo
  } & SwapExecutionCallbacks,
) => ExecuteSwapService

export function createExecuteSwapService(
  ctx: {
    getAddress?: () => string | undefined
    getSwapTxContext?: () => SwapTxStoreState
    getDerivedSwapInfo: () => DerivedSwapInfo
    getTxSettings: () => { customSlippageTolerance?: number }
    getIsFiatMode?: () => boolean
    getPresetInfo: () => { presetPercentage: PresetPercentage | undefined; preselectAsset: boolean | undefined }
    onPrepareSwap: PrepareSwapCallback
    onExecuteSwap: ExecuteSwapCallback
  } & SwapExecutionCallbacks,
): { executeSwap: ExecuteSwap } {
  // Unified execution pattern - handles both swaps and wraps through SwapHandlers
  return {
    executeSwap: (): void => {
      const { currencyAmounts, currencyAmountsUSDValue, txId, wrapType } = ctx.getDerivedSwapInfo()
      const { customSlippageTolerance } = ctx.getTxSettings()
      const swapTxContext = ctx.getSwapTxContext?.()
      const address = ctx.getAddress?.()

      if (!address || !swapTxContext || !isValidSwapTxContext(swapTxContext)) {
        ctx.onFailure(
          new Error(
            !address
              ? 'No account available'
              : !swapTxContext
                ? 'Missing swap transaction context'
                : 'Invalid swap transaction context',
          ),
        )
        return
      }

      const { presetPercentage, preselectAsset } = ctx.getPresetInfo()

      ctx
        .onExecuteSwap({
          address,
          swapTxContext,
          currencyInAmountUSD: currencyAmountsUSDValue[CurrencyField.INPUT] ?? undefined,
          currencyOutAmountUSD: currencyAmountsUSDValue[CurrencyField.OUTPUT] ?? undefined,
          isAutoSlippage: !customSlippageTolerance,
          presetPercentage,
          preselectAsset,
          onSuccess: ctx.onSuccess,
          onFailure: ctx.onFailure,
          onPending: ctx.onPending,
          txId,
          setCurrentStep: ctx.setCurrentStep,
          setSteps: ctx.setSteps,
          onClearForm: ctx.onClearForm,
          isFiatInputMode: ctx.getIsFiatMode?.(),
          wrapType,
          inputCurrencyAmount: currencyAmounts.input ?? undefined,
        })
        .catch(ctx.onFailure)
    },
  }
}
