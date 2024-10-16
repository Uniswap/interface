import { CurrencyAmount, Currency } from "@uniswap/sdk-core"
import { SignerMnemonicAccountMeta } from "uniswap/src/features/accounts/types"
import { TransactionStep } from "uniswap/src/features/transactions/swap/types/steps";
import { ValidatedSwapTxContext } from "uniswap/src/features/transactions/swap/types/swapTxAndGasInfo"

export type SetCurrentStepFn = (args: { step: TransactionStep; accepted: boolean }) => void

export interface SwapCallbackParams {
  account: SignerMnemonicAccountMeta
  swapTxContext: ValidatedSwapTxContext
  currencyInAmountUSD: Maybe<CurrencyAmount<Currency>>
  currencyOutAmountUSD: Maybe<CurrencyAmount<Currency>>
  isAutoSlippage: boolean
  onSuccess: () => void
  onFailure: (error?: Error) => void
  txId?: string
  setCurrentStep: SetCurrentStepFn
  setSteps: (steps: TransactionStep[]) => void
  isFiatInputMode?: boolean
}

export type SwapCallback = (params: SwapCallbackParams) => void
