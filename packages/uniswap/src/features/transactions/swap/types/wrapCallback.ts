import { CurrencyAmount, Currency } from "@uniswap/sdk-core"
import { GasEstimate } from "uniswap/src/data/tradingApi/types"
import { AccountDetails } from "uniswap/src/features/wallet/types/AccountDetails"
import { ValidatedTransactionRequest } from "uniswap/src/features/transactions/types/transactionRequests"
import { WrapType } from "uniswap/src/features/transactions/types/wrap"

export type WrapCallbackParams = {
  account: AccountDetails
  inputCurrencyAmount: CurrencyAmount<Currency>
  wrapType: WrapType.Wrap | WrapType.Unwrap
  onSuccess: () => void
  onFailure: () => void
  txRequest: ValidatedTransactionRequest
  txId?: string
  gasEstimate?: GasEstimate
}

export type WrapCallback = (params: WrapCallbackParams) => void
