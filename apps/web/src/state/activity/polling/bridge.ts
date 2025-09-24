import { TradingApi } from '@universe/api'
import ms from 'ms'
import { useCallback, useEffect, useMemo } from 'react'
import { ActivityUpdateTransactionType, type OnActivityUpdate } from 'state/activity/types'
import { useMultichainTransactions } from 'state/transactions/hooks'
import type { ConfirmedTransactionDetails, TransactionDetails } from 'state/transactions/types'
import { isPendingTx } from 'state/transactions/utils'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import type {
  BridgeTransactionInfo,
  InterfaceTransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'

const MIN_BRIDGE_WAIT_TIME = ms('2s')

type BridgeTransactionDetails = TransactionDetails & { typeInfo: BridgeTransactionInfo }

function isBridgeTransactionDetails(tx: InterfaceTransactionDetails): tx is BridgeTransactionDetails {
  return tx.typeInfo.type === TransactionType.Bridge
}

type BridgeTransactionDetailsWithChainId = BridgeTransactionDetails & { chainId: UniverseChainId }

function usePendingDepositedBridgeTransactions(): BridgeTransactionDetailsWithChainId[] {
  const multichainTransactions = useMultichainTransactions()

  return useMemo(
    () =>
      multichainTransactions.flatMap(([tx, chainId]) => {
        if (isPendingTx(tx) && isBridgeTransactionDetails(tx) && tx.typeInfo.depositConfirmed) {
          return { ...tx, chainId }
        } else {
          return []
        }
      }),
    [multichainTransactions],
  )
}

const SWAP_STATUS_TO_FINALIZED_STATUS: Partial<Record<TradingApi.SwapStatus, ConfirmedTransactionDetails['status']>> = {
  [TradingApi.SwapStatus.SUCCESS]: TransactionStatus.Success,
  [TradingApi.SwapStatus.FAILED]: TransactionStatus.Failed,
  [TradingApi.SwapStatus.EXPIRED]: TransactionStatus.Failed,
}

export function usePollPendingBridgeTransactions(onActivityUpdate: OnActivityUpdate) {
  const pendingDepositedBridgeTransactions = usePendingDepositedBridgeTransactions()

  const fetchStatuses = useCallback(
    async (txs: BridgeTransactionDetailsWithChainId[]) => {
      // Store txs in a map for easy access when calling onActivityUpdate
      const allTxMap: Record<string, BridgeTransactionDetailsWithChainId> = {}

      const txHashesByChain = txs.reduce<Map<UniverseChainId, string[]>>((acc, tx) => {
        if (tx.hash) {
          allTxMap[tx.hash] = tx
          acc.set(tx.chainId, [...(acc.get(tx.chainId) ?? []), tx.hash])
        }
        return acc
      }, new Map())

      for (const [chainId, txHashes] of txHashesByChain.entries()) {
        try {
          const tradingApiChainId = toTradingApiSupportedChainId(chainId)
          if (!tradingApiChainId) {
            continue
          }
          const response = await TradingApiClient.fetchSwaps({ txHashes, chainId: tradingApiChainId })
          for (const swap of response.swaps ?? []) {
            const { txHash, status } = swap

            const fullTxDetails = allTxMap[txHash ?? '']
            const updatedStatus = status ? SWAP_STATUS_TO_FINALIZED_STATUS[status] : undefined
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (txHash && updatedStatus && fullTxDetails) {
              onActivityUpdate({
                type: ActivityUpdateTransactionType.BaseTransaction,
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
    let isPolling = true

    const poll = async () => {
      if (!isPolling) {
        return
      }

      // Do not poll if there are no pending bridge transactions
      if (!pendingDepositedBridgeTransactions.length) {
        isPolling = false
        return
      }
      if (attempts >= 10) {
        logger.error(new Error('Max attempts reached polling for bridge txs, giving up'), {
          tags: {
            file: 'bridge',
            function: 'usePollPendingBridgeTransactions',
          },
        })
        isPolling = false
        return
      }

      await fetchStatuses(pendingDepositedBridgeTransactions)

      attempts++
      interval *= 2
      timeoutId = setTimeout(poll, interval)
    }

    timeoutId = setTimeout(poll, MIN_BRIDGE_WAIT_TIME)

    return () => {
      isPolling = false
      clearTimeout(timeoutId)
    }
  }, [fetchStatuses, pendingDepositedBridgeTransactions])
}
