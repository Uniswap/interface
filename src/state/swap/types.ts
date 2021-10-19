import { CurrencyAmount } from '@dynamic-amm/sdk'
import { DexConfig } from '../../constants/dexes'

export interface AggregationComparer {
  inputAmount: CurrencyAmount
  outputAmount: CurrencyAmount
  amountInUsd: string
  amountOutUsd: string
  receivedUsd: string
  // outputPriceUSD: number
  comparedDex: DexConfig
  tradeSaved?: {
    percent?: number
    usd?: string
  }
}
