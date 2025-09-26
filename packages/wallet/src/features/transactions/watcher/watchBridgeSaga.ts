import { TradingApi } from '@universe/api'
import { call, delay, SagaGenerator, select } from 'typed-redux-saga'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { makeSelectTransaction } from 'uniswap/src/features/transactions/selectors'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import {
  FINALIZED_SWAP_STATUS,
  MIN_BRIDGE_WAIT_TIME,
  SWAP_STATUS_TO_TX_STATUS,
} from 'wallet/src/features/transactions/watcher/transactionSagaUtils'

/**
 * Polls the backend API to determine the final status of a bridge transaction
 * *after* the initial send transaction is confirmed on the source chain.
 * @param transaction The bridge transaction details.
 * @returns The final TransactionStatus based on the backend polling.
 */
export function* waitForBridgingStatus(transaction: TransactionDetails): SagaGenerator<TransactionStatus> {
  const txHash = transaction.hash
  const chainId = toTradingApiSupportedChainId(transaction.chainId)

  if (!txHash || !chainId) {
    return TransactionStatus.Unknown
  }

  let swapStatus: TradingApi.SwapStatus | undefined
  const initialPollIntervalMs = 500
  const maxRetries = 10 // 500 ms, 1 second, 2 seconds...
  const backoffFactor = 2 // Each retry will double the wait time

  let pollIndex = 0
  yield* delay(MIN_BRIDGE_WAIT_TIME) // Wait minimum time before polling
  while (pollIndex < maxRetries) {
    const currentPollInterval = initialPollIntervalMs * Math.pow(backoffFactor, pollIndex)
    logger.debug('watchBridgeSaga', `[${txHash}] waitForBridgingStatus`, 'polling for status', {
      pollIndex,
      currentPollInterval,
    })
    yield* delay(currentPollInterval)

    const data = yield* call(TradingApiClient.fetchSwaps, {
      txHashes: [txHash],
      chainId,
    })

    const currentSwapStatus = data.swaps?.[0]?.status
    logger.debug('watchBridgeSaga', `[${txHash}] waitForBridgingStatus`, 'currentSwapStatus:', currentSwapStatus)
    if (currentSwapStatus && FINALIZED_SWAP_STATUS.includes(currentSwapStatus)) {
      swapStatus = currentSwapStatus
      break
    }

    // Check if the redux store has been updated with a new status (e.g., user cancelled)
    const selectTransactionById = yield* call(makeSelectTransaction)
    const updatedTransaction = yield* select(selectTransactionById, {
      address: transaction.from,
      chainId: transaction.chainId,
      txId: transaction.id,
    })

    if (
      updatedTransaction &&
      updatedTransaction.status !== TransactionStatus.Pending &&
      updatedTransaction.typeInfo.type === TransactionType.Bridge
    ) {
      logger.debug(
        'watchBridgeSaga',
        `[${transaction.id}] waitForBridgingStatus`,
        'Local update found: ',
        updatedTransaction.status,
      )
      return updatedTransaction.status
    }

    pollIndex++
  }
  logger.debug('watchBridgeSaga', `[${transaction.id}] waitForBridgingStatus`, 'final swapStatus:', swapStatus)
  // If we didn't get a status after polling, assume it's failed
  return swapStatus ? SWAP_STATUS_TO_TX_STATUS[swapStatus] : TransactionStatus.Failed
}
