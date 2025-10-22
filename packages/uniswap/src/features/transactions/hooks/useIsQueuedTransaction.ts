import { BigNumberish } from '@ethersproject/bignumber'
import { useMemo } from 'react'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { usePendingTransactions } from 'uniswap/src/features/transactions/hooks/usePendingTransactions'
import { isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

function useLowestPendingNonce(): BigNumberish | undefined {
  const activeAddresses = useActiveAddresses()

  if (!activeAddresses.evmAddress && !activeAddresses.svmAddress) {
    throw new Error('Account address not found')
  }

  const pending = usePendingTransactions({
    evmAddress: activeAddresses.evmAddress ?? null,
    svmAddress: activeAddresses.svmAddress ?? null,
  })

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
