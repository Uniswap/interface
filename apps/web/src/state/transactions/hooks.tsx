/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { BigNumber } from '@ethersproject/bignumber'
import type { TransactionResponse } from '@ethersproject/providers'
import type { Token } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useCallback, useEffect, useMemo } from 'react'
import { getRoutingForTransaction } from 'state/activity/utils'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { PendingTransactionDetails } from 'state/transactions/types'
import { isConfirmedTx, isPendingTx, isUniswapXOrderPending } from 'state/transactions/utils'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { selectTransactions } from 'uniswap/src/features/transactions/selectors'
import { addTransaction, deleteTransaction, interfaceCancelTransaction } from 'uniswap/src/features/transactions/slice'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import type {
  InterfaceTransactionDetails,
  TransactionDetails,
  TransactionTypeInfo as TransactionInfo,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isInterfaceTransaction } from 'uniswap/src/features/transactions/types/utils'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { usePrevious } from 'utilities/src/react/hooks'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

// Maximum age for a pending transaction to be displayed (5 minutes)
const MAX_PENDING_TRANSACTION_AGE_MS = 5 * ONE_MINUTE_MS

// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (
  response: TransactionResponse,
  info: TransactionInfo,
  deadline?: number,
) => void {
  const account = useAccount()
  const dispatch = useAppDispatch()

  return useCallback(
    // eslint-disable-next-line max-params
    (response: TransactionResponse, info: TransactionInfo, deadline?: number) => {
      if (account.status !== 'connected' || !account.chainId || !account.address) {
        return
      }

      const { hash } = response
      if (!hash) {
        throw Error('No transaction hash found.')
      }
      const chainId: UniverseChainId = toSupportedChainId(response.chainId) || account.chainId

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
          request: {
            to: response.to,
            from: response.from,
            data: response.data,
            value: response.value,
            gasLimit: response.gasLimit,
            gasPrice: response.gasPrice,
            nonce: response.nonce,
            chainId: response.chainId,
          },
        },
      }

      dispatch(addTransaction(transaction))
    },
    [account.address, account.chainId, account.status, dispatch],
  )
}

export function useTransactionRemover() {
  const account = useAccount()
  const dispatch = useAppDispatch()

  return useCallback(
    (hash: string) => {
      if (account.status !== 'connected' || !account.chainId || !account.address) {
        return
      }

      dispatch(
        deleteTransaction({
          chainId: account.chainId,
          id: hash,
          address: account.address,
        }),
      )
    },
    [account.chainId, account.address, account.status, dispatch],
  )
}

export function useTransactionCanceller() {
  const account = useAccount()
  const dispatch = useAppDispatch()

  return useCallback(
    ({ id, chainId, cancelHash }: { id: string; chainId: number; cancelHash: string }) => {
      if (!account.address) {
        return
      }
      dispatch(
        interfaceCancelTransaction({
          chainId,
          id,
          cancelHash,
          address: account.address,
        }),
      )
    },
    [dispatch, account.address],
  )
}

export function useMultichainTransactions(accountAddress?: string): [InterfaceTransactionDetails, UniverseChainId][] {
  const account = useAccount()
  const transactions = useAppSelector(selectTransactions)
  const address = accountAddress ?? account.address
  const status = account.status

  const { chains: enabledChainIds } = useEnabledChains()

  return useMemo(() => {
    if (status !== 'connected' || !address) {
      return []
    }

    const addressTransactions = transactions[address]
    if (!addressTransactions) {
      return []
    }

    return enabledChainIds.flatMap((chainId) => {
      const chainTransactions = addressTransactions[chainId]
      if (!chainTransactions) {
        return []
      }
      return Object.values(chainTransactions)
        .filter(isInterfaceTransaction)
        .map((tx): [InterfaceTransactionDetails, UniverseChainId] => [tx, chainId])
    })
  }, [transactions, address, status, enabledChainIds])
}

// returns all the transactions for the current chains
function useAllTransactionsByChain(): { [txHash: string]: InterfaceTransactionDetails } {
  const { evmAccount, svmAccount } = useWallet()
  const { chainId: evmChainId } = useAccount()

  const state = useAppSelector(selectTransactions)

  const evmAddress = evmAccount?.address
  const svmAddress = svmAccount?.address

  return useMemo(() => {
    const transactions: { [txHash: string]: InterfaceTransactionDetails } = {}
    if (evmAddress && evmChainId !== undefined) {
      Object.assign(transactions, state[evmAddress]?.[evmChainId] ?? {})
    }
    if (svmAddress) {
      Object.assign(transactions, state[svmAddress]?.[UniverseChainId.Solana] ?? {})
    }
    return transactions
  }, [evmChainId, evmAddress, svmAddress, state])
}

export function useTransaction(transactionHash?: string): InterfaceTransactionDetails | undefined {
  const allTransactions = useAllTransactionsByChain()

  if (!transactionHash) {
    return undefined
  }

  return allTransactions[transactionHash]
}

export function useIsTransactionPending(transactionHash?: string): boolean {
  const transactions = useAllTransactionsByChain()

  if (!transactionHash || !transactions[transactionHash]) {
    return false
  }

  return isPendingTx(transactions[transactionHash])
}

export function useIsTransactionConfirmed(transactionHash?: string): boolean {
  const transactions = useAllTransactionsByChain()

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
  const allTransactions = useAllTransactionsByChain()
  return useMemo(() => {
    if (typeof token?.address !== 'string' || typeof spender !== 'string') {
      return undefined
    }

    // eslint-disable-next-line guard-for-in
    for (const txHash in allTransactions) {
      const tx = allTransactions[txHash]
      if (!tx || isConfirmedTx(tx) || tx.typeInfo.type !== TransactionType.Approve) {
        continue
      }
      if (
        tx.typeInfo.spender === spender &&
        tx.typeInfo.tokenAddress === token.address &&
        isTransactionRecent(tx) &&
        tx.typeInfo.approvalAmount !== undefined
      ) {
        return BigNumber.from(tx.typeInfo.approvalAmount)
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

function isPendingTransactionRecent(tx: TransactionDetails): boolean {
  return Date.now() - tx.addedTime < MAX_PENDING_TRANSACTION_AGE_MS
}

/**
 * Returns pending transactions that are less than MAX_PENDING_TRANSACTION_AGE_MS old.
 * Note: The age filter is evaluated on re-render, not in real-time. Transactions won't
 * automatically disappear after 5 minutes - they'll be filtered on the next re-render
 * triggered by user interaction or state changes. This is intentional to avoid
 * unnecessary polling/timer complexity.
 */
export function usePendingTransactions(): PendingTransactionDetails[] {
  const allTransactions = useAllTransactionsByChain()
  const account = useAccount()

  return useMemo(
    () =>
      Object.values(allTransactions).filter(
        (tx): tx is PendingTransactionDetails =>
          tx.from === account.address && isPendingTx(tx) && isPendingTransactionRecent(tx),
      ),
    [account.address, allTransactions],
  )
}

function usePendingLPTransactions(): PendingTransactionDetails[] {
  const allTransactions = useAllTransactionsByChain()
  const account = useAccount()

  return useMemo(
    () =>
      Object.values(allTransactions).filter(
        (tx): tx is PendingTransactionDetails =>
          tx.from === account.address &&
          isPendingTx(tx) &&
          (
            [
              TransactionType.LiquidityIncrease,
              TransactionType.LiquidityDecrease,
              TransactionType.CreatePool,
              TransactionType.CreatePair,
              TransactionType.MigrateLiquidityV3ToV4,
              TransactionType.CollectFees,
            ] as TransactionType[]
          ).includes(tx.typeInfo.type),
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

// TODO(PORT-343): unify with wallet
export function useUniswapXOrderByOrderHash(orderHash?: string): UniswapXOrderDetails | undefined {
  const allTransactions = useAllTransactionsByChain()

  return useMemo(() => {
    if (!orderHash) {
      return undefined
    }

    return Object.values(allTransactions).find(
      (tx): tx is UniswapXOrderDetails => isUniswapX(tx) && 'orderHash' in tx && tx.orderHash === orderHash,
    )
  }, [allTransactions, orderHash])
}

// TODO(PORT-343): unify with wallet
export function usePendingUniswapXOrders(): UniswapXOrderDetails[] {
  const allTransactions = useAllTransactionsByChain()
  const account = useAccount()

  return useMemo(() => {
    return Object.values(allTransactions).filter(
      (tx): tx is UniswapXOrderDetails => tx.from === account.address && isUniswapX(tx) && isUniswapXOrderPending(tx),
    )
  }, [account.address, allTransactions])
}
