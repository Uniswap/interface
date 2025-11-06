import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import type { SwapTxStoreState } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/createSwapTxStore'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { SwapCallbackParams } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import type {
  ExecuteSwapCallback,
  PrepareSwapCallback,
} from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { AccountDetails, isSignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { CurrencyField } from 'uniswap/src/types/currency'

type ExecuteSwap = () => void

export interface ExecuteSwapService {
  executeSwap: ExecuteSwap
}

export type GetExecuteSwapService = (ctx: {
  onSuccess: () => void
  onFailure: () => void
  onPending: () => void
  setCurrentStep: SwapCallbackParams['setCurrentStep']
  setSteps: SwapCallbackParams['setSteps']
  getSwapTxContext: () => SwapTxAndGasInfo
}) => ExecuteSwapService

export function createExecuteSwapService(ctx: {
  getAccount?: () => AccountDetails | undefined
  getSwapTxContext?: () => SwapTxStoreState
  getDerivedSwapInfo: () => DerivedSwapInfo
  getTxSettings: () => { customSlippageTolerance?: number }
  getIsFiatMode?: () => boolean
  getPresetInfo: () => { presetPercentage: PresetPercentage | undefined; preselectAsset: boolean | undefined }
  onSuccess: () => void
  onFailure: (error?: Error) => void
  onPending: () => void
  setCurrentStep: SwapCallbackParams['setCurrentStep']
  setSteps: SwapCallbackParams['setSteps']
  onPrepareSwap: PrepareSwapCallback
  onExecuteSwap: ExecuteSwapCallback
}): { executeSwap: ExecuteSwap } {
  // Unified execution pattern - handles both swaps and wraps through SwapHandlers
  return {
    executeSwap: (): void => {
      const { currencyAmounts, currencyAmountsUSDValue, txId, wrapType } = ctx.getDerivedSwapInfo()
      const { customSlippageTolerance } = ctx.getTxSettings()
      const swapTxContext = ctx.getSwapTxContext?.()
      const account = ctx.getAccount?.()

      if (
        !account ||
        !swapTxContext ||
        !isSignerMnemonicAccountDetails(account) ||
        !isValidSwapTxContext(swapTxContext)
      ) {
        ctx.onFailure(
          new Error(
            !account
              ? 'No account available'
              : !swapTxContext
                ? 'Missing swap transaction context'
                : !isSignerMnemonicAccountDetails(account)
                  ? 'Invalid account type - must be signer mnemonic account'
                  : 'Invalid swap transaction context',
          ),
        )
        return
      }

      const { presetPercentage, preselectAsset } = ctx.getPresetInfo()

      ctx
        .onExecuteSwap({
          account,
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
          isFiatInputMode: ctx.getIsFiatMode?.(),
          wrapType,
          inputCurrencyAmount: currencyAmounts.input ?? undefined,
        })
        .catch(ctx.onFailure)
    },
  }
}
