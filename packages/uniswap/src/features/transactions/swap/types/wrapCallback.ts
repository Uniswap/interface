import { CurrencyAmount, Currency } from "@uniswap/sdk-core"
import { AccountMeta } from "uniswap/src/features/accounts/types"
import { TransactionStep } from "uniswap/src/features/transactions/steps/types"
import { ValidatedTransactionRequest } from "uniswap/src/features/transactions/swap/utils/trade"
import { SwapTxAndGasInfo } from "uniswap/src/features/transactions/swap/types/swapTxAndGasInfo"
import { GasFeeEstimates } from "uniswap/src/features/transactions/types/transactionDetails"
import { WrapType } from "uniswap/src/features/transactions/types/wrap"

export type WrapCallbackParams = {
  account: AccountMeta
  inputCurrencyAmount: CurrencyAmount<Currency>
  wrapType: WrapType.Wrap | WrapType.Unwrap | WrapType.FewWrap | WrapType.FewUnwrap
  onSuccess: () => void
  onFailure: () => void
  txRequest: ValidatedTransactionRequest
  txId?: string
  gasEstimates?: GasFeeEstimates
  // New: swapTxContext for generating steps with approval
  swapTxContext?: SwapTxAndGasInfo
  setCurrentStep?: (step: TransactionStep) => void
  setSteps?: (steps: TransactionStep[]) => void
  inputCurrencyId?: string
  outputCurrencyId?: string
}

export type WrapCallback = (params: WrapCallbackParams) => void
