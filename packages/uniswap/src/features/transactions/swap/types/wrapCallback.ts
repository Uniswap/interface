import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { GasEstimate } from '@universe/api'
import type { WrapTransactionStep, WrapTransactionStepWalletCall } from 'uniswap/src/features/transactions/steps/wrap'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'

export type WrapCallbackParams = {
  address: string
  inputCurrencyAmount: CurrencyAmount<Currency>
  wrapType: WrapType.Wrap | WrapType.Unwrap
  onSuccess: () => void
  onFailure: () => void
  step: WrapTransactionStep | WrapTransactionStepWalletCall
  txId?: string
  gasEstimate?: GasEstimate
}

export type WrapCallback = (params: WrapCallbackParams) => void
