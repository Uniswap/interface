import { NEVER_RELOAD } from '@uniswap/redux-multicall'
import { useWeb3React } from '@web3-react/core'
import { SupportedInterfaceChainId, getChain, useSupportedChainId } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import useBlockNumber, { useFastForwardBlockNumber } from 'lib/hooks/useBlockNumber'
import ms from 'ms'
import { useCallback, useEffect, useMemo } from 'react'
import { CanceledError, RetryableError, retry } from 'state/activity/polling/retry'
import { OnActivityUpdate } from 'state/activity/types'
import { useAppDispatch } from 'state/hooks'
import { isPendingTx, useMultichainTransactions, useTransactionRemover } from 'state/transactions/hooks'
import { checkedTransaction } from 'state/transactions/reducer'
import { PendingTransactionDetails } from 'state/transactions/types'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { InterfaceChainId, RetryOptions } from 'uniswap/src/types/chains'
import { SUBSCRIPTION_CHAINIDS } from 'utilities/src/apollo/constants'

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

const DEFAULT_RETRY_OPTIONS: RetryOptions = { n: 1, minWait: 0, maxWait: 0 }

function usePendingTransactions(chainId?: SupportedInterfaceChainId) {
  const multichainTransactions = useMultichainTransactions()
  return useMemo(() => {
    if (!chainId) {
      return []
    }
    return multichainTransactions.flatMap(([tx, txChainId]) => {
      if (isPendingTx(tx) && txChainId === chainId) {
        return tx
      } else {
        return []
      }
    })
  }, [chainId, multichainTransactions])
}

export function usePollPendingTransactions(onActivityUpdate: OnActivityUpdate) {
  const realtimeEnabled = useFeatureFlag(FeatureFlags.Realtime)
  const { provider } = useWeb3React()
  const account = useAccount()

  const pendingTransactions = usePendingTransactions(
    // We can skip polling when the app's current chain is supported by the subscription service.
    realtimeEnabled &&
      account.chainId &&
      (SUBSCRIPTION_CHAINIDS as unknown as InterfaceChainId[]).includes(account.chainId)
      ? undefined
      : account.chainId,
  )
  const supportedChain = useSupportedChainId(account.chainId)
  const hasPending = pendingTransactions.length > 0
  const blockTimestamp = useCurrentBlockTimestamp(hasPending ? undefined : NEVER_RELOAD)

  const lastBlockNumber = useBlockNumber()
  const fastForwardBlockNumber = useFastForwardBlockNumber()
  const removeTransaction = useTransactionRemover()
  const dispatch = useAppDispatch()

  const getReceipt = useCallback(
    (tx: PendingTransactionDetails) => {
      if (!provider || !supportedChain) {
        throw new Error('No provider or chainId')
      }
      const retryOptions =
        getChain({ chainId: supportedChain })?.pendingTransactionsRetryOptions ?? DEFAULT_RETRY_OPTIONS
      return retry(
        () =>
          provider.getTransactionReceipt(tx.hash).then(async (receipt) => {
            if (receipt === null) {
              if (account.isConnected) {
                // Remove transactions past their deadline or - if there is no deadline - older than 6 hours.
                if (tx.deadline) {
                  // Deadlines are expressed as seconds since epoch, as they are used on-chain.
                  if (blockTimestamp && tx.deadline < blockTimestamp.toNumber()) {
                    removeTransaction(tx.hash)
                  }
                } else if (tx.addedTime + ms(`6h`) < Date.now()) {
                  removeTransaction(tx.hash)
                }
              }
              throw new RetryableError()
            }
            return receipt
          }),
        retryOptions,
      )
    },
    [account.isConnected, blockTimestamp, provider, removeTransaction, supportedChain],
  )

  useEffect(() => {
    if (!account.chainId || !provider || !lastBlockNumber || !hasPending) {
      return
    }

    const cancels = pendingTransactions
      .filter((tx) => shouldCheck(lastBlockNumber, tx))
      .map((tx) => {
        const { promise, cancel } = getReceipt(tx)
        promise
          .then((receipt) => {
            if (!account.chainId) {
              return
            }
            fastForwardBlockNumber(receipt.blockNumber)
            onActivityUpdate({
              type: 'transaction',
              chainId: account.chainId,
              original: tx,
              update: {
                status: receipt.status === 1 ? TransactionStatus.Confirmed : TransactionStatus.Failed,
                info: tx.info,
              },
            })
          })
          .catch((error) => {
            if (error instanceof CanceledError || !account.chainId) {
              return
            }
            dispatch(checkedTransaction({ chainId: account.chainId, hash: tx.hash, blockNumber: lastBlockNumber }))
          })
        return cancel
      })

    return () => {
      cancels.forEach((cancel) => cancel())
    }
  }, [
    account.chainId,
    provider,
    lastBlockNumber,
    getReceipt,
    pendingTransactions,
    fastForwardBlockNumber,
    hasPending,
    dispatch,
    onActivityUpdate,
  ])
}
