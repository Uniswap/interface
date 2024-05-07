import { NEVER_RELOAD } from '@uniswap/redux-multicall'
import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import useBlockNumber, { useFastForwardBlockNumber } from 'lib/hooks/useBlockNumber'
import ms from 'ms'
import { useCallback, useEffect, useMemo } from 'react'
import { useAppDispatch } from 'state/hooks'
import { isPendingTx, useMultichainTransactions, useTransactionRemover } from 'state/transactions/hooks'
import { checkedTransaction } from 'state/transactions/reducer'
import { TransactionDetails } from 'state/transactions/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { SUBSCRIPTION_CHAINIDS } from 'utilities/src/apollo/constants'
import { OnActivityUpdate } from '../types'
import { CanceledError, RetryOptions, RetryableError, retry } from './retry'

interface Transaction {
  addedTime: number
  receipt?: unknown
  lastCheckedBlockNumber?: number
}

export function shouldCheck(lastBlockNumber: number, tx: Transaction): boolean {
  if (tx.receipt) return false
  if (!tx.lastCheckedBlockNumber) return true
  const blocksSinceCheck = lastBlockNumber - tx.lastCheckedBlockNumber
  if (blocksSinceCheck < 1) return false
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

const RETRY_OPTIONS_BY_CHAIN_ID: { [chainId: number]: RetryOptions } = {
  [ChainId.ARBITRUM_ONE]: { n: 10, minWait: 250, maxWait: 1000 },
  [ChainId.ARBITRUM_GOERLI]: { n: 10, minWait: 250, maxWait: 1000 },
  [ChainId.OPTIMISM]: { n: 10, minWait: 250, maxWait: 1000 },
  [ChainId.OPTIMISM_GOERLI]: { n: 10, minWait: 250, maxWait: 1000 },
  [ChainId.BASE]: { n: 10, minWait: 250, maxWait: 1000 },
  [ChainId.BLAST]: { n: 10, minWait: 250, maxWait: 1000 },
}
const DEFAULT_RETRY_OPTIONS: RetryOptions = { n: 1, minWait: 0, maxWait: 0 }

function usePendingTransactions(chainId?: ChainId) {
  const multichainTransactions = useMultichainTransactions()
  return useMemo(() => {
    if (!chainId) return []
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
  const { account, chainId, provider } = useWeb3React()

  const pendingTransactions = usePendingTransactions(
    // We can skip polling when the app's current chain is supported by the subscription service.
    realtimeEnabled && chainId && SUBSCRIPTION_CHAINIDS.includes(chainId) ? undefined : chainId
  )
  const hasPending = pendingTransactions.length > 0
  const blockTimestamp = useCurrentBlockTimestamp(hasPending ? undefined : NEVER_RELOAD)

  const lastBlockNumber = useBlockNumber()
  const fastForwardBlockNumber = useFastForwardBlockNumber()
  const removeTransaction = useTransactionRemover()
  const dispatch = useAppDispatch()

  const getReceipt = useCallback(
    (tx: TransactionDetails) => {
      if (!provider || !chainId) throw new Error('No provider or chainId')
      const retryOptions = RETRY_OPTIONS_BY_CHAIN_ID[chainId] ?? DEFAULT_RETRY_OPTIONS
      return retry(
        () =>
          provider.getTransactionReceipt(tx.hash).then(async (receipt) => {
            if (receipt === null) {
              if (account) {
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
        retryOptions
      )
    },
    [account, blockTimestamp, chainId, provider, removeTransaction]
  )

  useEffect(() => {
    if (!chainId || !provider || !lastBlockNumber || !hasPending) return

    const cancels = pendingTransactions
      .filter((tx) => shouldCheck(lastBlockNumber, tx))
      .map((tx) => {
        const { promise, cancel } = getReceipt(tx)
        promise
          .then((receipt) => {
            fastForwardBlockNumber(receipt.blockNumber)
            onActivityUpdate({
              type: 'transaction',
              chainId,
              original: tx,
              receipt,
            })
          })
          .catch((error) => {
            if (error instanceof CanceledError) return
            dispatch(checkedTransaction({ chainId, hash: tx.hash, blockNumber: lastBlockNumber }))
          })
        return cancel
      })

    return () => {
      cancels.forEach((cancel) => cancel())
    }
  }, [
    chainId,
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
