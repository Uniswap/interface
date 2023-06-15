import { BigNumber } from '@ethersproject/bignumber'
import type { TransactionResponse } from '@ethersproject/providers'
import { Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ALL_SUPPORTED_CHAIN_IDS, SupportedChainId } from 'constants/chains'
import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { addTransaction, removeTransaction } from './reducer'
import { TransactionDetails, TransactionInfo, TransactionType } from './types'

// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (
  response: TransactionResponse,
  info: TransactionInfo,
  deadline?: number
) => void {
  const { chainId, account } = useWeb3React()
  const dispatch = useAppDispatch()

  return useCallback(
    (response: TransactionResponse, info: TransactionInfo, deadline?: number) => {
      if (!account) return
      if (!chainId) return

      const { hash, nonce } = response
      if (!hash) {
        throw Error('No transaction hash found.')
      }
      dispatch(addTransaction({ hash, from: account, info, chainId, nonce, deadline }))
    },
    [account, chainId, dispatch]
  )
}

export function useTransactionRemover() {
  const { chainId, account } = useWeb3React()
  const dispatch = useAppDispatch()

  return useCallback(
    (hash: string) => {
      if (!account) return
      if (!chainId) return

      dispatch(removeTransaction({ hash, chainId }))
    },
    [account, chainId, dispatch]
  )
}

export function useMultichainTransactions(): [TransactionDetails, SupportedChainId][] {
  const state = useAppSelector((state) => state.transactions)
  return ALL_SUPPORTED_CHAIN_IDS.flatMap((chainId) =>
    state[chainId]
      ? Object.values(state[chainId]).map((tx): [TransactionDetails, SupportedChainId] => [tx, chainId])
      : []
  )
}

// returns all the transactions for the current chain
export function useAllTransactions(): { [txHash: string]: TransactionDetails } {
  const { chainId } = useWeb3React()

  const state = useAppSelector((state) => state.transactions)

  return chainId ? state[chainId] ?? {} : {}
}

export function useTransaction(transactionHash?: string): TransactionDetails | undefined {
  const allTransactions = useAllTransactions()

  if (!transactionHash) {
    return undefined
  }

  return allTransactions[transactionHash]
}

export function useIsTransactionPending(transactionHash?: string): boolean {
  const transactions = useAllTransactions()

  if (!transactionHash || !transactions[transactionHash]) return false

  return !transactions[transactionHash].receipt
}

export function useIsTransactionConfirmed(transactionHash?: string): boolean {
  const transactions = useAllTransactions()

  if (!transactionHash || !transactions[transactionHash]) return false

  return Boolean(transactions[transactionHash].receipt)
}

/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
export function isTransactionRecent(tx: TransactionDetails): boolean {
  return new Date().getTime() - tx.addedTime < 86_400_000
}

function usePendingApprovalAmount(token?: Token, spender?: string): BigNumber | undefined {
  const allTransactions = useAllTransactions()
  return useMemo(() => {
    if (typeof token?.address !== 'string' || typeof spender !== 'string') {
      return undefined
    }
    for (const txHash in allTransactions) {
      const tx = allTransactions[txHash]
      if (!tx || tx.receipt || tx.info.type !== TransactionType.APPROVAL) continue
      if (tx.info.spender === spender && tx.info.tokenAddress === token.address && isTransactionRecent(tx)) {
        return BigNumber.from(tx.info.amount)
      }
    }
    return undefined
  }, [allTransactions, spender, token?.address])
}

// returns whether a token has a pending approval transaction
export function useHasPendingApproval(token?: Token, spender?: string): boolean {
  return usePendingApprovalAmount(token, spender)?.gt(0) ?? false
}

export function useHasPendingRevocation(token?: Token, spender?: string): boolean {
  return usePendingApprovalAmount(token, spender)?.eq(0) ?? false
}

export function useHasPendingTransactions() {
  const allTransactions = useAllTransactions()
  return useMemo(() => {
    return Object.values(allTransactions).filter((tx) => !tx.receipt).length > 0
  }, [allTransactions])
}
