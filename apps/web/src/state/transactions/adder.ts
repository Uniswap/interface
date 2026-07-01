import { useCallback } from 'react'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import type {
  InterfaceTransactionDetails,
  TransactionDetails,
  TransactionOptions,
  TransactionTypeInfo as TransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionOriginType, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useAccount } from '~/hooks/useAccount'
import { getRoutingForTransaction } from '~/state/activity/utils'
import { useAppDispatch } from '~/state/hooks'

export interface AddTransactionParams {
  hash: string
  chainId: UniverseChainId
  request: TransactionOptions['request']
  info: TransactionInfo
  deadline?: number
}

/**
 * Build a transaction and add it to the store
 */
export function useAddTransaction(): (params: AddTransactionParams) => void {
  const account = useAccount()
  const dispatch = useAppDispatch()

  return useCallback(
    ({ hash, chainId, request, info, deadline }: AddTransactionParams) => {
      if (account.status !== 'connected' || !account.chainId || !account.address) {
        return
      }
      // Create a classic transaction details object
      const transaction: TransactionDetails<InterfaceTransactionDetails> = {
        id: hash,
        hash,
        from: account.address,
        typeInfo: info,
        chainId,
        routing: getRoutingForTransaction(info),
        transactionOriginType: TransactionOriginType.Internal,
        status: TransactionStatus.Pending,
        addedTime: Date.now(),
        deadline,
        ownerAddress: account.address,
        options: {
          request,
        },
      }
      dispatch(addTransaction(transaction))
    },
    [account.address, account.chainId, account.status, dispatch],
  )
}

/**
 * Variant of `useTransactionAdder` for transactions submitted
 * through the `@universe/chains` contract seam, which returns
 * only a transaction `Hash` rather than an ethers tx.
 */
// We want to parity, oxlint is stricter
// oxlint-disable-next-line max-params
export function useTransactionAdderFromHash(): (
  tx: { hash: string; chainId: UniverseChainId },
  info: TransactionInfo,
  deadline?: number,
) => void {
  const account = useAccount()
  const addTransactionToStore = useAddTransaction()

  return useCallback(
    // oxlint-disable-next-line max-params
    (tx: { hash: string; chainId: UniverseChainId }, info: TransactionInfo, deadline?: number) => {
      addTransactionToStore({
        hash: tx.hash,
        chainId: tx.chainId,
        request: {
          from: account.address,
          chainId: tx.chainId,
        },
        info,
        deadline,
      })
    },
    [account.address, addTransactionToStore],
  )
}
