import { BigNumber } from '@ethersproject/bignumber'
import type { TransactionResponse } from '@ethersproject/providers'
import { Token } from '@uniswap/sdk-core'
import { SupportedInterfaceChainId } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { SwapResult } from 'hooks/useSwapCallback'
import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { TradeFillType } from 'state/routing/types'
import { addTransaction, cancelTransaction, removeTransaction } from 'state/transactions/reducer'
import {
  ConfirmedTransactionDetails,
  PendingTransactionDetails,
  TransactionDetails,
  TransactionInfo,
  TransactionType,
} from 'state/transactions/types'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { WEB_SUPPORTED_CHAIN_IDS } from 'uniswap/src/types/chains'

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

export function useMultichainTransactions(): [TransactionDetails, SupportedInterfaceChainId][] {
  const state = useAppSelector((state) => state.transactions)
  return WEB_SUPPORTED_CHAIN_IDS.flatMap((chainId) =>
    state[chainId]
      ? Object.values(state[chainId]).map((tx): [TransactionDetails, SupportedInterfaceChainId] => [tx, chainId])
      : [],
  )
}

// returns all the transactions for the current chain
function useAllTransactions(): { [txHash: string]: TransactionDetails } {
  const account = useAccount()

  const state = useAppSelector((state) => state.transactions)

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

export function useSwapTransactionStatus(swapResult: SwapResult | undefined): TransactionStatus | undefined {
  const transaction = useTransaction(swapResult?.type === TradeFillType.Classic ? swapResult.response.hash : undefined)
  if (!transaction) {
    return undefined
  }
  return transaction.status
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

export function isPendingTx(tx: TransactionDetails): tx is PendingTransactionDetails {
  return tx.status === TransactionStatus.Pending && !tx.cancelled
}

export function isConfirmedTx(tx: TransactionDetails): tx is ConfirmedTransactionDetails {
  return tx.status === TransactionStatus.Confirmed || tx.status === TransactionStatus.Failed
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
