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
  exactAmountFiat?: string
  focusOnCurrencyField?: CurrencyField | null
  recipient?: string
  isFiatInput?: boolean
  selectingCurrencyField?: CurrencyField
  showRecipientSelector?: boolean
  customSlippageTolerance?: number
}
