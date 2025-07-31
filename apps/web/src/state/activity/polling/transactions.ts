import { useAccount } from 'hooks/useAccount'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import ms from 'ms'
import { useCallback, useEffect, useMemo } from 'react'
import { CanceledError, RetryableError, retry } from 'state/activity/polling/retry'
import { OnActivityUpdate } from 'state/activity/types'
import { useAppDispatch } from 'state/hooks'
import { useMultichainTransactions, useTransactionRemover } from 'state/transactions/hooks'
import { PendingTransactionDetails } from 'state/transactions/types'
import { isPendingTx } from 'state/transactions/utils'
import { fetchSwaps } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { SwapStatus } from 'uniswap/src/data/tradingApi/__generated__/models/SwapStatus'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { RetryOptions, UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { interfaceCheckedTransaction } from 'uniswap/src/features/transactions/slice'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isValidHexString } from 'uniswap/src/utils/hex'
import { TransactionReceipt } from 'viem'
import { usePublicClient } from 'wagmi'

interface Transaction {
  addedTime: number
  receipt?: unknown
  lastCheckedBlockNumber?: number
}

export function shouldCheck(lastBlockNumber: number, tx: Transaction): boolean {
  if (tx.receipt) {
    return false
  }
  if (!tx.lastCheckedBlockNumber) {
    return true
  }
  const blocksSinceCheck = lastBlockNumber - tx.lastCheckedBlockNumber
  if (blocksSinceCheck < 1) {
    return false
  }
  const minutesPending = (new Date().getTime() - tx.addedTime) / ms(`1m`)
  if (minutesPending > 60) {
    // every 10 blocks if pending longer than an hour
    return blocksSinceCheck > 9
  } else if (minutesPending > 5) {
    // every 3 blocks if pending longer than 5 minutes
    return blocksSinceCheck > 2
  } else {
    // otherwise every block
    return true
  }
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = { n: 1, minWait: 0, medWait: 0, maxWait: 0 }

function usePendingTransactions(chainId?: UniverseChainId): PendingTransactionDetails[] {
  const multichainTransactions = useMultichainTransactions()
  return useMemo(() => {
    if (!chainId) {
      return []
    }
    return multichainTransactions.flatMap(([tx, txChainId]) => {
      // Avoid polling for already-deposited bridge transactions, as they will be finalized by the bridge updater.
      if (isPendingTx(tx, /* skipDepositedBridgeTxs = */ true) && txChainId === chainId) {
        // Ignore batch txs which need to be polled against wallet instead of chain.
        return tx.batchInfo ? [] : [tx]
      }
      return []
    })
  }, [chainId, multichainTransactions])
}

const SWAP_STATUS_TO_FINALIZED_STATUS: Partial<Record<SwapStatus, TransactionReceipt['status']>> = {
  [SwapStatus.SUCCESS]: 'success',
  [SwapStatus.FAILED]: 'reverted',
  [SwapStatus.EXPIRED]: 'reverted',
}

export function usePollPendingTransactions(onActivityUpdate: OnActivityUpdate) {
  const account = useAccount()
  const publicClient = usePublicClient()
  const tradingApiPollingEnabled = useFeatureFlag(FeatureFlags.TradingApiSwapConfirmation)

  const pendingTransactions = usePendingTransactions(account.chainId)
  const hasPending = pendingTransactions.length > 0
  const blockTimestamp = useCurrentBlockTimestamp({ refetchInterval: !hasPending ? false : undefined })

  const lastBlockNumber = useBlockNumber()
  const removeTransaction = useTransactionRemover()
  const dispatch = useAppDispatch()

  const getReceipt = useCallback(
    (tx: PendingTransactionDetails): { promise: Promise<TransactionReceipt['status']>; cancel: () => void } => {
      if (!publicClient || !account.chainId) {
        throw new Error('No publicClient or chainId')
      }
      const retryOptions = getChainInfo(account.chainId).pendingTransactionsRetryOptions ?? DEFAULT_RETRY_OPTIONS
      return retry(() => {
        if (!isValidHexString(tx.hash)) {
          throw new Error(`Invalid transaction hash: ${tx.hash}`)
        }
        return publicClient.getTransactionReceipt({ hash: tx.hash }).then(async (receipt) => {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (receipt === null) {
            if (account.isConnected) {
              // Remove transactions past their deadline or - if there is no deadline - older than 6 hours.
              if (tx.deadline) {
                // Deadlines are expressed as seconds since epoch, as they are used on-chain.
                if (blockTimestamp && tx.deadline < Number(blockTimestamp)) {
                  removeTransaction(tx.hash)
                }
              } else if (tx.addedTime + ms(`6h`) < Date.now()) {
                removeTransaction(tx.hash)
              }
            }
            throw new RetryableError()
          }

          sendAnalyticsEvent(InterfaceEventName.SwapConfirmedOnClient, {
            time: Date.now() - tx.addedTime,
            swap_success: receipt.status === 'success',
            chainId: account.chainId,
            txHash: tx.hash,
          })

          return receipt.status
        })
      }, retryOptions)
    },
    [account.chainId, account.isConnected, blockTimestamp, publicClient, removeTransaction],
  )

  const getReceiptWithTradingApi = useCallback(
    (tx: PendingTransactionDetails): { promise: Promise<TransactionReceipt['status']>; cancel: () => void } => {
      const chainId = toTradingApiSupportedChainId(account.chainId)
      if (!account.chainId || !chainId) {
        throw new Error('No chainId')
      }

      const pollingInterval = getChainInfo(account.chainId).tradingApiPollingIntervalMs
      const retryOptions: RetryOptions = {
        n: 20,
        minWait: pollingInterval,
        medWait: pollingInterval,
        maxWait: pollingInterval,
      }

      return retry(() => {
        return fetchSwaps({ txHashes: [tx.hash], chainId })
          .then((res) => {
            const status = res.swaps?.[0]?.status
            const finalizedStatus = status ? SWAP_STATUS_TO_FINALIZED_STATUS[status] : undefined

            if (!finalizedStatus) {
              if (account.isConnected) {
                // Remove transactions past their deadline or - if there is no deadline - older than 6 hours.
                if (tx.deadline) {
                  // Deadlines are expressed as seconds since epoch, as they are used on-chain.
                  if (blockTimestamp && tx.deadline < Number(blockTimestamp)) {
                    removeTransaction(tx.hash)
                  }
                } else if (tx.addedTime + ms(`6h`) < Date.now()) {
                  removeTransaction(tx.hash)
                }
              }

              throw new RetryableError()
            }

            sendAnalyticsEvent(InterfaceEventName.SwapConfirmedOnClient, {
              time: Date.now() - tx.addedTime,
              swap_success: finalizedStatus === 'success',
              chainId: account.chainId,
              txHash: tx.hash,
            })

            return finalizedStatus
          })
          .catch((_error) => {
            throw new RetryableError()
          })
      }, retryOptions)
    },
    [account.chainId, account.isConnected, blockTimestamp, removeTransaction],
  )

  useEffect(() => {
    if (!account.address || !account.chainId || !publicClient || !lastBlockNumber || !hasPending) {
      return undefined
    }

    const cancels = pendingTransactions
      .filter((tx) => shouldCheck(lastBlockNumber, tx))
      .map((tx) => {
        const { promise, cancel } = tradingApiPollingEnabled ? getReceiptWithTradingApi(tx) : getReceipt(tx)
        promise
          .then((status) => {
            if (!account.chainId) {
              return
            }
            onActivityUpdate({
              type: 'transaction',
              chainId: account.chainId,
              original: tx,
              update: {
                status: status === 'success' ? TransactionStatus.Success : TransactionStatus.Failed,
                typeInfo: tx.typeInfo,
              },
            })
          })
          .catch((error) => {
            if (error instanceof CanceledError || !account.chainId) {
              return
            }
            dispatch(
              interfaceCheckedTransaction({
                chainId: account.chainId!,
                id: tx.id,
                address: account.address!,
                blockNumber: lastBlockNumber,
              }),
            )
          })
        return cancel
      })

    return () => {
      cancels.forEach((cancel) => cancel())
    }
  }, [
    account.address,
    account.chainId,
    publicClient,
    lastBlockNumber,
    getReceipt,
    pendingTransactions,
    hasPending,
    dispatch,
    onActivityUpdate,
    getReceiptWithTradingApi,
    tradingApiPollingEnabled,
  ])
}
