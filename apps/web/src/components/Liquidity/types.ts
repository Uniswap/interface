import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Dispatch, SetStateAction } from 'react'
import { PositionField } from 'types/position'

export interface DepositState {
  exactField: PositionField
  exactAmount?: string
}

export type DepositContextType = {
  depositState: DepositState
  setDepositState: Dispatch<SetStateAction<DepositState>>
  derivedDepositInfo: DepositInfo
}

export interface DepositInfo {
  formattedAmounts?: { [field in PositionField]?: string }
  currencyBalances?: { [field in PositionField]?: CurrencyAmount<Currency> }
  currencyAmounts?: { [field in PositionField]?: CurrencyAmount<Currency> }
  currencyAmountsUSDValue?: { [field in PositionField]?: CurrencyAmount<Currency> }
}
