import { CurrencyAmount, Currency } from "@uniswap/sdk-core"
import { PresetPercentage } from "uniswap/src/components/CurrencyInputPanel/PresetAmountButton";
import { SignerMnemonicAccountMeta } from "uniswap/src/features/accounts/types"
import { TransactionStep } from "uniswap/src/features/transactions/steps/types";
import { ValidatedSwapTxContext } from "uniswap/src/features/transactions/swap/types/swapTxAndGasInfo"

export type SetCurrentStepFn = (args: { step: TransactionStep; accepted: boolean }) => void

export interface SwapCallbackParams {
  account: SignerMnemonicAccountMeta
  swapTxContext: ValidatedSwapTxContext
  currencyInAmountUSD: Maybe<CurrencyAmount<Currency>>
  currencyOutAmountUSD: Maybe<CurrencyAmount<Currency>>
  isAutoSlippage: boolean
  presetPercentage?: PresetPercentage
  preselectAsset?: boolean
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
