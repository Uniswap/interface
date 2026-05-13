import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import type { ReactNode } from 'react'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { PositionField } from '~/types/position'

export interface DepositState {
  exactField: PositionField
  exactAmounts: {
    [field in PositionField]?: string
  }
}

export interface DepositInfo {
  formattedAmounts?: { [field in PositionField]?: string }
  currencyBalances?: { [field in PositionField]?: CurrencyAmount<Currency> }
  currencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  currencyAmountsUSDValue?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  currencyMaxAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  error?: ReactNode
}

export type FeeTierData = {
  id?: string
  fee: FeeData
  formattedFee: string
  totalLiquidityUsd: number
  percentage: Percent
  tvl: string
  created: boolean
  boostedApr?: number
}
