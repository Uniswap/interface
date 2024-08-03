import { TradeableAsset } from 'uniswap/src/entities/assets'

export enum CurrencyField {
  INPUT = 'input',
  OUTPUT = 'output',
}

export enum TradeProtocolPreference {
  Default = 'Default',
  V2Only = 'V2Only',
  V3Only = 'V3Only',
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
  tradeProtocolPreference?: TradeProtocolPreference
}
