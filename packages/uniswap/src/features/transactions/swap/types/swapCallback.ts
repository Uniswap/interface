import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'

export type SetCurrentStepFn = (args: { step: TransactionStep; accepted: boolean }) => void

export type SwapExecutionCallbacks = {
  setCurrentStep: SetCurrentStepFn
  setSteps: (steps: TransactionStep[]) => void
  onSuccess: () => void
  onFailure: (error?: Error, onPressRetry?: () => void) => void
  /** Called by async submission code to communicate UI should display a pending state. */
  onPending: () => void
  /** Called when a plan is closed early by the user. */
  onClearForm: () => void
}

export interface SwapCallbackParams extends SwapExecutionCallbacks {
  swapTxContext: ValidatedSwapTxContext
  currencyInAmountUSD: Maybe<CurrencyAmount<Currency>>
  currencyOutAmountUSD: Maybe<CurrencyAmount<Currency>>
  isAutoSlippage: boolean
  presetPercentage?: PresetPercentage
  preselectAsset?: boolean
  isSmartWalletTransaction?: boolean
  includesDelegation?: boolean
  txId?: string
  isFiatInputMode?: boolean
}

export type SwapCallback = (params: SwapCallbackParams) => void
