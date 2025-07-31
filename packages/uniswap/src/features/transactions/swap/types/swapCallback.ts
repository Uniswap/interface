import { CurrencyAmount, Currency } from "@uniswap/sdk-core"
import type { PresetPercentage } from "uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types";
import { TransactionStep } from "uniswap/src/features/transactions/steps/types";
import { ValidatedSwapTxContext } from "uniswap/src/features/transactions/swap/types/swapTxAndGasInfo"
import { SignerMnemonicAccountDetails } from "uniswap/src/features/wallet/types/AccountDetails";

export type SetCurrentStepFn = (args: { step: TransactionStep; accepted: boolean }) => void

export interface SwapCallbackParams {
  account: SignerMnemonicAccountDetails
  swapTxContext: ValidatedSwapTxContext
  currencyInAmountUSD: Maybe<CurrencyAmount<Currency>>
  currencyOutAmountUSD: Maybe<CurrencyAmount<Currency>>
  isAutoSlippage: boolean
  presetPercentage?: PresetPercentage
  preselectAsset?: boolean
  isSmartWalletTransaction?: boolean
  includesDelegation?: boolean
  onSuccess: () => void
  onFailure: (error?: Error, onPressRetry?: () => void) => void
  /** Called by async submission code to communicate UI should display a pending state. */
  onPending: () => void
  txId?: string
  setCurrentStep: SetCurrentStepFn
  setSteps: (steps: TransactionStep[]) => void
  isFiatInputMode?: boolean
}

export type SwapCallback = (params: SwapCallbackParams) => void
