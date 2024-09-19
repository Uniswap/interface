import { CurrencyAmount, Currency } from "@uniswap/sdk-core"
import { providers } from "ethers/lib/ethers"
import { AccountMeta } from "uniswap/src/features/accounts/types"
import { WrapType } from "uniswap/src/features/transactions/types/wrap"

export type WrapCallbackParams = {
  account: AccountMeta | undefined
  inputCurrencyAmount: CurrencyAmount<Currency> | null | undefined
  wrapType: WrapType.Wrap | WrapType.Unwrap
  onSuccess: () => void
  txRequest?: providers.TransactionRequest
  txId?: string
}

export type WrapCallback = (params: WrapCallbackParams) => void
