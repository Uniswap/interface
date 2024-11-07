import ms from 'ms'
import { useCallback, useEffect, useMemo } from 'react'
import { OnActivityUpdate } from 'state/activity/types'
import { useMultichainTransactions } from 'state/transactions/hooks'
import {
  BridgeTransactionInfo,
  ConfirmedTransactionDetails,
  TransactionDetails,
  TransactionType,
} from 'state/transactions/types'
import { isPendingTx } from 'state/transactions/utils'
import { fetchSwaps } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { SwapStatus } from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { logger } from 'utilities/src/logger/logger'

const MIN_BRIDGE_WAIT_TIME = ms('2s')

type BridgeTransactionDetails = TransactionDetails & { info: BridgeTransactionInfo }
function isBridgeTransactionDetails(tx: TransactionDetails): tx is BridgeTransactionDetails {
  return tx.info.type === TransactionType.BRIDGE
}

type BridgeTransactionDetailsWithChainId = BridgeTransactionDetails & { chainId: UniverseChainId }
function usePendingDepositedBridgeTransactions(): BridgeTransactionDetailsWithChainId[] {
  const multichainTransactions = useMultichainTransactions()

  return useMemo(
    () =>
      multichainTransactions.flatMap(([tx, chainId]) => {
        if (isPendingTx(tx) && isBridgeTransactionDetails(tx) && tx.info.depositConfirmed) {
          return { ...tx, chainId }
        } else {
          return []
        }
      }),
    [multichainTransactions],
  )
}

const SWAP_STATUS_TO_FINALIZED_STATUS: Partial<Record<SwapStatus, ConfirmedTransactionDetails['status']>> = {
  [SwapStatus.SUCCESS]: TransactionStatus.Confirmed,
  [SwapStatus.FAILED]: TransactionStatus.Failed,
  [SwapStatus.EXPIRED]: TransactionStatus.Failed,
}

export function usePollPendingBridgeTransactions(onActivityUpdate: OnActivityUpdate) {
  const pendingDepositedBridgeTransactions = usePendingDepositedBridgeTransactions()

  const fetchStatuses = useCallback(
    async (txs: BridgeTransactionDetailsWithChainId[]) => {
      // Store txs in a map for easy access when calling onActivityUpdate
      const allTxMap: Record<string, BridgeTransactionDetailsWithChainId> = {}

      const txHashesByChain = txs.reduce<Map<UniverseChainId, string[]>>((acc, tx) => {
        allTxMap[tx.hash] = tx
        acc.set(tx.chainId, [...(acc.get(tx.chainId) ?? []), tx.hash])
        return acc
      }, new Map())

      for (const [chainId, txHashes] of txHashesByChain.entries()) {
        try {
          const tradingApiChainId = toTradingApiSupportedChainId(chainId)
          if (!tradingApiChainId) {
            continue
          }
          const response = await fetchSwaps({ txHashes, chainId: tradingApiChainId })
          for (const swap of response.swaps ?? []) {
            const { txHash, status } = swap

            const fullTxDetails = allTxMap[txHash ?? '']
            const updatedStatus = status ? SWAP_STATUS_TO_FINALIZED_STATUS[status] : undefined
            if (txHash && updatedStatus && fullTxDetails) {
              onActivityUpdate({
                type: 'transaction',
                chainId,
                update: { ...fullTxDetails, status: updatedStatus },
                original: fullTxDetails,
              })
            }
          }
        } catch {
          logger.debug('bridge', `usePollPendingBridgeTransactions`, 'failed to fetch from swapStatus', {
            chainId,
            txHashes,
          })
        }
      }
    },
    [onActivityUpdate],
  )

  useEffect(() => {
    let attempts = 0
    let interval = 500
    let timeoutId: NodeJS.Timeout

    const poll = async () => {
      // Do not poll if there are no pending bridge transactions
      if (!pendingDepositedBridgeTransactions.length) {
        return
      }
      if (attempts >= 10) {
        logger.error(new Error('Max attempts reached polling for bridge txs, giving up'), {
          tags: {
            file: 'bridge',
            function: 'usePollPendingBridgeTransactions',
          },
        })
        return
      }

      await fetchStatuses(pendingDepositedBridgeTransactions)

      attempts++
      interval *= 2
      timeoutId = setTimeout(poll, interval)
    }

    timeoutId = setTimeout(poll, MIN_BRIDGE_WAIT_TIME)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [fetchStatuses, pendingDepositedBridgeTransactions])
}
