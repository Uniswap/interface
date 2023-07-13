import { TradeableAsset } from 'wallet/src/entities/assets'

export enum CurrencyField {
  INPUT = 'input',
  OUTPUT = 'output',
}

export interface TransactionState {
  txId?: string
  [CurrencyField.INPUT]: TradeableAsset | null
  [CurrencyField.OUTPUT]: TradeableAsset | null
  exactCurrencyField: CurrencyField
  exactAmountToken: string
  exactAmountUSD?: string
  focusOnCurrencyField?: CurrencyField | null
  recipient?: string
  isUSDInput?: boolean
  selectingCurrencyField?: CurrencyField
  showRecipientSelector?: boolean
  customSlippageTolerance?: number
}
