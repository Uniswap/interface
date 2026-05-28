import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import type { VersionedTransaction } from '@solana/web3.js'
import { useEffect } from 'react'

type SignSolanaVersionedTransactionFn = (tx: VersionedTransaction) => Promise<VersionedTransaction>

let current: SignSolanaVersionedTransactionFn | null = null

const registerSignSolanaTransaction = (fn: SignSolanaVersionedTransactionFn | null) => {
  current = fn
}

/**
 * Sign a Solana transaction with the current wallet from '@solana/wallet-adapter-react'.
 * @param tx - The transaction to sign.
 * @returns The signed transaction.
 */
export const signSolanaTransactionWithCurrentWallet: SignSolanaVersionedTransactionFn = async (tx) => {
  if (!current) {
    throw new Error('No wallet registered to sign Solana transactions')
  }
  return current(tx)
}

export function SolanaSignerUpdater() {
  const { signTransaction } = useSolanaWallet()

  useEffect(() => {
    if (signTransaction) {
      registerSignSolanaTransaction(signTransaction)
    }
  }, [signTransaction])

  return null
}
