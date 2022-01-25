import { Token } from '@uniswap/sdk-core'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { Transaction, TransactionInfo, transactionsAtom, TransactionType } from 'lib/state/transactions'
import ms from 'ms.macro'
import { useCallback } from 'react'
import invariant from 'tiny-invariant'

import useBlockNumber from '../useBlockNumber'
import Updater from './updater'

function isTransactionRecent(transaction: Transaction) {
  return Date.now() - transaction.addedTime < ms`1d`
}

export function usePendingTransactions() {
  const { chainId } = useActiveWeb3React()
  const txs = useAtomValue(transactionsAtom)
  return (chainId ? txs[chainId] : null) ?? {}
}

export function useAddTransaction() {
  const { chainId } = useActiveWeb3React()
  const blockNumber = useBlockNumber()
  const updateTxs = useUpdateAtom(transactionsAtom)

  return useCallback(
    (info: TransactionInfo) => {
      invariant(chainId)
      const txChainId = chainId
      const { hash } = info.response

      updateTxs((chainTxs) => {
        const txs = chainTxs[txChainId] || {}
        txs[hash] = { addedTime: new Date().getTime(), lastCheckedBlockNumber: blockNumber, info }
        chainTxs[chainId] = txs
      })
    },
    [blockNumber, chainId, updateTxs]
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
      tx.receipt === undefined &&
      tx.info.type === TransactionType.APPROVAL &&
      tx.info.tokenAddress === token.address &&
      tx.info.spenderAddress === spender &&
      isTransactionRecent(tx)
  )
}

export function TransactionsUpdater() {
  const pendingTransactions = usePendingTransactions()

  const updateTxs = useUpdateAtom(transactionsAtom)
  const onCheck = useCallback(
    ({ chainId, hash, blockNumber }) => {
      updateTxs((txs) => {
        const tx = txs[chainId]?.[hash]
        if (tx) {
          tx.lastCheckedBlockNumber = tx.lastCheckedBlockNumber
            ? Math.max(tx.lastCheckedBlockNumber, blockNumber)
            : blockNumber
        }
      })
    },
    [updateTxs]
  )
  const onReceipt = useCallback(
    ({ chainId, hash, receipt }) => {
      updateTxs((txs) => {
        const tx = txs[chainId]?.[hash]
        if (tx) {
          tx.receipt = receipt
        }
      })
    },
    [updateTxs]
  )

  return <Updater pendingTransactions={pendingTransactions} onCheck={onCheck} onReceipt={onReceipt} />
}
