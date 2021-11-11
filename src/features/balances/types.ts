import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ChainIdTo } from 'src/constants/chains'

export interface Balance {
  amount: string
  updatedAt?: number
}

export type ChainIdToCurrencyAmount = ChainIdTo<CurrencyAmount<Currency>>
