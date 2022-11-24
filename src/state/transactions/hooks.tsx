import { TransactionResponse } from '@ethersproject/abstract-provider'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useBlockNumber } from 'state/application/hooks'
import { AppDispatch, AppState } from 'state/index'
import { findTx } from 'utils'

import { addTransaction } from './actions'
import { GroupedTxsByHash, TRANSACTION_TYPE, TransactionDetails } from './type'

export type TransactionHistory = {
  hash: string
  desiredChainId?: ChainId // ChainID after switching.
  type?: TRANSACTION_TYPE
  summary?: string
  approval?: { tokenAddress: string; spender: string }
  arbitrary?: any
  firstTxHash?: string
}

// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (tx: TransactionHistory) => void {
  const { chainId, account, isEVM } = useActiveWeb3React()
  const { library } = useWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const blockNumber = useBlockNumber()

  return useCallback(
    async ({ hash, desiredChainId, type, summary, approval, arbitrary, firstTxHash }: TransactionHistory) => {
      if (!account) return
      if (!chainId) return

      let tx: TransactionResponse | undefined
      if (isEVM) {
        tx = await library?.getTransaction(hash)
      }

      dispatch(
        addTransaction({
          hash,
          from: account,
          to: tx?.to,
          nonce: tx?.nonce,
          data: tx?.data,
          sentAtBlock: blockNumber,
          chainId: desiredChainId ?? chainId,
          approval,
          type,
          summary,
          arbitrary,
          firstTxHash,
        }),
      )
    },
    [account, chainId, dispatch, blockNumber, library, isEVM],
  )
}

// returns all the transactions for the current chain
export function useAllTransactions(): GroupedTxsByHash | undefined {
  const { chainId } = useActiveWeb3React()

  const state = useSelector<AppState, AppState['transactions'][number]>(state => state.transactions[chainId])

  return state
}

export function useIsTransactionPending(transactionHash?: string): boolean {
  const transactions = useAllTransactions()

  if (!transactionHash) return false

  const tx = findTx(transactions, transactionHash)
  if (!tx) return false

  return !tx.receipt
}

/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
export function isTransactionGroupRecent(txs: TransactionDetails[]): boolean {
  return new Date().getTime() - (txs[0]?.addedTime ?? 0) < 86_400_000
}

// we want the latest one to come first, so return negative if a is after b
export function newTransactionsGroupFirst(a: TransactionDetails[], b: TransactionDetails[]) {
  return (b[0]?.addedTime ?? 0) - (a[0]?.addedTime ?? 0)
}

/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
export function isTransactionRecent(tx: TransactionDetails): boolean {
  return new Date().getTime() - tx.addedTime < 86_400_000
}

// we want the latest one to come first, so return negative if a is after b
export function newTransactionsFirst(a: TransactionDetails, b: TransactionDetails) {
  return b.addedTime - a.addedTime
}

// returns whether a token has a pending approval transaction
export function useHasPendingApproval(tokenAddress: string | undefined, spender: string | undefined): boolean {
  const allTransactions = useAllTransactions()
  return useMemo(
    () =>
      typeof tokenAddress === 'string' &&
      typeof spender === 'string' &&
      !!allTransactions &&
      Object.values(allTransactions)
        .flat()
        .some(tx => {
          if (!tx) return false
          if (tx.receipt) {
            return false
          } else {
            const approval = tx.approval
            if (!approval) return false
            return approval.spender === spender && approval.tokenAddress === tokenAddress && isTransactionRecent(tx)
          }
        }),
    [allTransactions, spender, tokenAddress],
  )
}
