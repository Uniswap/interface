import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Transaction, VersionedTransaction } from '@solana/web3.js'

export type SolanaEncode = {
  setupTx: Transaction | null
  swapTx: VersionedTransaction
}
