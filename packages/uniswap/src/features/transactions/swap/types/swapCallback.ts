import { CurrencyAmount, Currency } from "@uniswap/sdk-core"
import { SignerMnemonicAccountMeta } from "uniswap/src/features/accounts/types"
import { ValidatedSwapTxContext } from "uniswap/src/features/transactions/swap/contexts/SwapTxContext"

export interface SwapCallbackParams {
  account: SignerMnemonicAccountMeta
  swapTxContext: ValidatedSwapTxContext
  currencyInAmountUSD: Maybe<CurrencyAmount<Currency>>
  currencyOutAmountUSD: Maybe<CurrencyAmount<Currency>>
  isAutoSlippage: boolean
  onSubmit: () => void
  onFailure: () => void
  txId?: string
  isFiatInputMode?: boolean
}

export type SwapCallback = (params: SwapCallbackParams) => void
