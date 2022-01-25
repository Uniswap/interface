import { Token } from '@uniswap/sdk-core'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { Transaction, TransactionInfo, transactionsAtom, TransactionType } from 'lib/state/transactions'
import ms from 'ms.macro'
import { useCallback } from 'react'
import invariant from 'tiny-invariant'

function isTransactionRecent(transaction: Transaction) {
  return Date.now() - transaction.dateAdded < ms`1d`
}

export function useAddTransaction() {
  const { chainId } = useActiveWeb3React()
  const updateTxs = useUpdateAtom(transactionsAtom)

  return useCallback(
    (info: TransactionInfo) => {
      invariant(chainId)
      const txChainId = chainId
      const { hash } = info.response

      updateTxs((chainTxs) => {
        const txs = chainTxs[txChainId] || {}
        txs[hash] = { dateAdded: Date.now(), info }
        chainTxs[chainId] = txs
      })
    },
    [chainId, updateTxs]
  )
}

export function useIsPendingApproval(token?: Token, spender?: string) {
  const { chainId } = useActiveWeb3React()
  const txs = useAtomValue(transactionsAtom)
  if (!chainId || !token || !spender) return false

  const chainTxs = txs[chainId]
  if (!chainTxs) return false

  return Object.values(chainTxs).some(
    (tx) =>
      tx &&
      tx.status === undefined &&
      tx.info.type === TransactionType.APPROVAL &&
      tx.info.tokenAddress === token.address &&
      tx.info.spenderAddress === spender &&
      isTransactionRecent(tx)
  )
}

// TODO(zzmp): Port over the updater (src/state/transactions/updater.tsx)
