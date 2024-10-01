import { CurrencyAmount, Currency } from "@uniswap/sdk-core"
import { AccountMeta } from "uniswap/src/features/accounts/types"
import { ValidatedTransactionRequest } from "uniswap/src/features/transactions/swap/utils/trade"
import { GasFeeEstimates } from "uniswap/src/features/transactions/types/transactionDetails"
import { WrapType } from "uniswap/src/features/transactions/types/wrap"

export type WrapCallbackParams = {
  account: AccountMeta
  inputCurrencyAmount: CurrencyAmount<Currency>
  wrapType: WrapType.Wrap | WrapType.Unwrap
  onSuccess: () => void
  onFailure: () => void
  txRequest: ValidatedTransactionRequest
  txId?: string
  gasEstimates?: GasFeeEstimates
}

export type WrapCallback = (params: WrapCallbackParams) => void
