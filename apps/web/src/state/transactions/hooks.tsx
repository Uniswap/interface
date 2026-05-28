import { BigNumber } from '@ethersproject/bignumber'
import type { TransactionResponse } from '@ethersproject/providers'
import { Token } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useCallback, useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { addTransaction, cancelTransaction, removeTransaction } from 'state/transactions/reducer'
import {
  PendingTransactionDetails,
  TransactionDetails,
  TransactionInfo,
  TransactionType,
} from 'state/transactions/types'
import { isConfirmedTx, isPendingTx } from 'state/transactions/utils'
import { ALL_CHAIN_IDS, UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePrevious } from 'utilities/src/react/hooks'

// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (
  response: TransactionResponse,
  info: TransactionInfo,
  deadline?: number,
) => void {
  const account = useAccount()
  const dispatch = useAppDispatch()

  return useCallback(
    (response: TransactionResponse, info: TransactionInfo, deadline?: number) => {
      if (account.status !== 'connected' || !account.chainId) {
        return
      }

      const { hash, nonce } = response
      if (!hash) {
        throw Error('No transaction hash found.')
      }
      const chainId = ('chainId' in info && info.chainId) || account.chainId
      dispatch(addTransaction({ hash, from: account.address, info, chainId, nonce, deadline }))
    },
    [account.address, account.chainId, account.status, dispatch],
  )
}

export function useTransactionRemover() {
  const account = useAccount()
  const dispatch = useAppDispatch()

  return useCallback(
    (hash: string) => {
      if (account.status !== 'connected' || !account.chainId) {
        return
      }

      dispatch(removeTransaction({ hash, chainId: account.chainId }))
    },
    [account.chainId, account.status, dispatch],
  )
}

export function useTransactionCanceller() {
  const dispatch = useAppDispatch()

  return useCallback(
    (hash: string, chainId: number, cancelHash: string) => {
      dispatch(cancelTransaction({ hash, chainId, cancelHash }))
    },
    [dispatch],
  )
}

export function useMultichainTransactions(): [TransactionDetails, UniverseChainId][] {
  const state = useAppSelector((state) => state.localWebTransactions)

  return useMemo(
    () =>
      ALL_CHAIN_IDS.flatMap((chainId) =>
        state[chainId]
          ? Object.values(state[chainId]).map((tx): [TransactionDetails, UniverseChainId] => [tx, chainId])
          : [],
      ),
    [state],
  )
}

// returns all the transactions for the current chain
function useAllTransactions(): { [txHash: string]: TransactionDetails } {
  const account = useAccount()

  const state = useAppSelector((state) => state.localWebTransactions)

  return account.status === 'connected' && account.chainId ? state[account.chainId] ?? {} : {}
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

  if (!transactionHash || !transactions[transactionHash]) {
    return false
  }

  return isPendingTx(transactions[transactionHash])
}

export function useIsTransactionConfirmed(transactionHash?: string): boolean {
  const transactions = useAllTransactions()

  if (!transactionHash || !transactions[transactionHash]) {
    return false
  }

  return isConfirmedTx(transactions[transactionHash])
}

/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
function isTransactionRecent(tx: TransactionDetails): boolean {
  return new Date().getTime() - tx.addedTime < 86_400_000
}

function usePendingApprovalAmount(token?: Token, spender?: string): BigNumber | undefined {
  const allTransactions = useAllTransactions()
  return useMemo(() => {
    if (typeof token?.address !== 'string' || typeof spender !== 'string') {
      return undefined
    }

    // eslint-disable-next-line guard-for-in
    for (const txHash in allTransactions) {
      const tx = allTransactions[txHash]
      if (!tx || isConfirmedTx(tx) || tx.info.type !== TransactionType.APPROVAL) {
        continue
      }
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

export function usePendingTransactions(): PendingTransactionDetails[] {
  const allTransactions = useAllTransactions()
  const account = useAccount()

  return useMemo(
    () =>
      Object.values(allTransactions).filter(
        (tx): tx is PendingTransactionDetails => tx.from === account.address && isPendingTx(tx),
      ),
    [account.address, allTransactions],
  )
}

function usePendingLPTransactions(): PendingTransactionDetails[] {
  const allTransactions = useAllTransactions()
  const account = useAccount()

  return useMemo(
    () =>
      Object.values(allTransactions).filter(
        (tx): tx is PendingTransactionDetails =>
          tx.from === account.address &&
          isPendingTx(tx) &&
          [
            TransactionType.INCREASE_LIQUIDITY,
            TransactionType.DECREASE_LIQUIDITY,
            TransactionType.CREATE_POSITION,
            TransactionType.MIGRATE_LIQUIDITY_V3_TO_V4,
            TransactionType.COLLECT_FEES,
          ].includes(tx.info.type),
      ),
    [account.address, allTransactions],
  )
}

export function usePendingLPTransactionsChangeListener(callback: () => void) {
  const pendingLPTransactions = usePendingLPTransactions()
  const previousPendingCount = usePrevious(pendingLPTransactions.length)
  useEffect(() => {
    if (pendingLPTransactions.length !== previousPendingCount) {
      callback()
    }
  }, [pendingLPTransactions, callback, previousPendingCount])
}
