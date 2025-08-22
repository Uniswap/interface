import { BigNumberish } from '@ethersproject/bignumber'
import { useMemo } from 'react'
import { usePendingTransactions } from 'uniswap/src/features/transactions/hooks/usePendingTransactions'
import { isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'

function useLowestPendingNonce(): BigNumberish | undefined {
  const { evmAccount } = useWallet()

  if (!evmAccount) {
    throw new Error('EVM account address not found')
  }

  const pending = usePendingTransactions(evmAccount.address)

  return useMemo(() => {
    let min: BigNumberish | undefined
    if (!pending) {
      return undefined
    }
    pending.map((txn: TransactionDetails) => {
      if (isClassic(txn)) {
        const currentNonce = txn.options.request.nonce
        min = min ? (currentNonce ? (min < currentNonce ? min : currentNonce) : min) : currentNonce
      }
    })
    return min
  }, [pending])
}

export function useIsQueuedTransaction(tx: TransactionDetails): boolean {
  const lowestPendingNonce = useLowestPendingNonce()

  if (isUniswapX(tx)) {
    return false
  }

  const nonce = tx.options.request.nonce
  return nonce && lowestPendingNonce ? nonce > lowestPendingNonce : false
}
