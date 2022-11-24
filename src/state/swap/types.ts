import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Transaction, VersionedTransaction } from '@solana/web3.js'

export interface AggregationComparer {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  amountInUsd: string
  amountOutUsd: string
  receivedUsd: string
  // outputPriceUSD: number
  comparedDex: string
  tradeSaved?: {
    percent?: number
    usd?: string
  }
}

export type SolanaEncode = {
  setupTx: Transaction | null
  swapTx: VersionedTransaction
}
