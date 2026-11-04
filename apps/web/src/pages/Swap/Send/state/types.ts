import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import type { GasFeeResult } from '@universe/api'
import type { TransactionRequest } from '~/chains'

export interface RecipientData {
  address: string
  ensName?: string
  unitag?: string
}

export enum SendInputError {
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INSUFFICIENT_FUNDS_FOR_GAS = 'INSUFFICIENT_FUNDS_FOR_GAS',
}

export type SendInfo = {
  currencyBalance?: CurrencyAmount<Currency>
  parsedTokenAmount?: CurrencyAmount<Currency>
  exactAmountOut?: string
  recipientData?: RecipientData
  transaction?: TransactionRequest
  gasFee?: GasFeeResult
  gasFeeCurrencyAmount?: CurrencyAmount<Currency>
  inputError?: SendInputError
}
