import { TradingApi } from '@universe/api'
import { providers } from 'ethers'
import { call, delay, put, SagaGenerator, select } from 'typed-redux-saga'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { makeSelectTransaction } from 'uniswap/src/features/transactions/selectors'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { POLLING_CONSTANTS, shouldCheckTransaction, withTimeout } from 'uniswap/src/utils/polling'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { buildPendingTransactionStuckProperties } from 'wallet/src/features/transactions/telemetry/nonceTelemetry'
import { processTransactionReceipt } from 'wallet/src/features/transactions/utils'
import {
  FINALIZED_SWAP_STATUS,
  SWAP_STATUS_TO_TX_STATUS,
} from 'wallet/src/features/transactions/watcher/transactionSagaUtils'
import { isMaybeBridge } from 'wallet/src/features/transactions/watcher/utils'

/**
 * Smart polling version of waitForReceipt that uses lastCheckedBlockNumber optimization
 * This is a saga generator function that can update the transaction state
 */
export function* waitForReceiptWithSmartPolling({
  hash,
  provider,
  transaction,
}: {
  hash: string
  provider: providers.Provider
  transaction: TransactionDetails
}): SagaGenerator<providers.TransactionReceipt> {
  let elapsed = 0

  while (elapsed < POLLING_CONSTANTS.MAX_POLLING_TIME) {
    try {
      // Get current block number for optimization
      const currentBlockNumber = yield* call([provider, provider.getBlockNumber])

      // Check if we should poll based on smart logic
      if (!shouldCheckTransaction(currentBlockNumber, transaction)) {
        // Wait a bit before checking again
        yield* delay(POLLING_CONSTANTS.POLL_INTERVAL)
        elapsed += POLLING_CONSTANTS.POLL_INTERVAL
        continue
      }

      // Try to get the receipt
      const receipt = yield* call([provider, provider.getTransactionReceipt], hash)

      // Update lastCheckedBlockNumber in the transaction
      yield* put(
        transactionActions.checkedTransaction({
          chainId: transaction.chainId,
          id: transaction.id,
          address: transaction.from,
          blockNumber: currentBlockNumber,
        }),
      )

      // Re-select the transaction from store to use the authoritative state
      const selectTxById = yield* call(makeSelectTransaction)
      const refreshed = yield* select(selectTxById, {
        address: transaction.from,
        chainId: transaction.chainId,
        txId: transaction.id,
      })

      if (refreshed) {
        transaction = refreshed
      }

      // oxlint-disable-next-line typescript/no-unnecessary-condition
      if (receipt?.blockNumber) {
        logger.debug('watchOnChainTransactionSaga', 'waitForReceiptWithSmartPolling', 'Tx receipt received', hash)
        return receipt
      }
    } catch (error) {
      logger.debug('watchOnChainTransactionSaga', 'waitForReceiptWithSmartPolling', 'Error polling for receipt', {
        hash,
        error,
      })
    }

    yield* delay(POLLING_CONSTANTS.POLL_INTERVAL)
    elapsed += POLLING_CONSTANTS.POLL_INTERVAL
  }

  throw new Error('Timed out waiting for transaction receipt')
}

export async function waitForReceipt(
  hash: string,
  provider: providers.Provider,
): Promise<providers.TransactionReceipt> {
  const txReceipt = await withTimeout(provider.waitForTransaction(hash), {
    timeoutMs: ONE_MINUTE_MS * 5,
    errorMsg: 'Timed out waiting for transaction receipt',
  })

  // oxlint-disable-next-line typescript/no-unnecessary-condition
  if (txReceipt) {
    logger.debug('watchOnChainTransactionSaga', 'waitForReceipt', 'Tx receipt received', hash)
  }

  return txReceipt
}

// oxlint-disable-next-line typescript/explicit-function-return-type
function* waitForTransactionInStore(
  transaction: RequireNonNullable<TransactionDetails, 'hash'>,
  polling: {
    delayMs: number
    timeoutMs: number
  } = { delayMs: 100, timeoutMs: 5000 },
) {
  const maxAttempts = Math.floor(polling.timeoutMs / polling.delayMs)
  for (let i = 0; i < maxAttempts; i++) {
    const selectTransactionById = yield* call(makeSelectTransaction)
    const updatedTransaction = yield* select(selectTransactionById, {
      address: transaction.from,
      chainId: transaction.chainId,
      txId: transaction.id,
    })

    if (updatedTransaction && updatedTransaction.status !== TransactionStatus.Pending) {
      return updatedTransaction
    }

    yield* delay(polling.delayMs)
  }

  throw new Error('Transaction not found in store after timeout')
}

/**
 * Fetches the transaction receipt onchain and updates the transaction with
 * network fee and receipt data. Used when Trading API provides status but not receipt details.
 */
// oxlint-disable-next-line typescript/explicit-function-return-type
export function* updateTransactionWithReceipt(
  transaction: RequireNonNullable<TransactionDetails, 'hash'>,
  provider: providers.Provider,
) {
  const ethersReceipt = yield* call(waitForReceipt, transaction.hash, provider)

  // Wait for trading api to update the transaction status first
  const updatedTransaction = yield* call(waitForTransactionInStore, transaction)

  const transactionWithReceipt = processTransactionReceipt({
    ethersReceipt,
    transaction: updatedTransaction,
  })

  yield* put(transactionActions.updateTransactionWithoutWatch(transactionWithReceipt))
}

export type TransactionStatusResult = {
  status: TransactionStatus
  /** On-chain tx hash resolved from the /swaps response (relevant for 4337 UserOps where the mined hash differs from the userOpHash) */
  txHash?: string
  sponsorInfo?: TradingApi.SponsorMetadata
  paymaster?: string
}

/**
 * Polls the backend API to determine the final status of a transaction
 * @param transaction The transaction details.
 * @returns The final TransactionStatus and resolved txHash based on the backend polling.
 */
export function* waitForTransactionStatus(transaction: TransactionDetails): SagaGenerator<TransactionStatusResult> {
  const txHash = transaction.hash
  const userOpHash = transaction.userOpHash
  const chainId = toTradingApiSupportedChainId(transaction.chainId)

  if ((!txHash && !userOpHash) || !chainId) {
    return { status: TransactionStatus.Unknown }
  }

  const lookupId = txHash ?? userOpHash
  const isUserOp = !!userOpHash

  const isMaybeBridgeTransaction = isMaybeBridge(
    'options' in transaction ? transaction.options.request?.to?.toString() : undefined,
    transaction.chainId,
  )

  const tradingApiPollingIntervalMs = isMaybeBridgeTransaction
    ? ONE_SECOND_MS
    : getChainInfo(transaction.chainId).tradingApiPollingIntervalMs

  let swapStatus: TradingApi.SwapStatus | undefined
  let resolvedTxHash: string | undefined
  let resolvedSponsorInfo: TradingApi.SponsorMetadata | undefined
  let resolvedPaymaster: string | undefined

  // User-op time to inclusion is longer: ~30s for p90
  // Classic swaps also have a updateTransactionWithReceipt backup mechanism, which userOps do not
  const maxRetries = isUserOp ? 20 : 10
  const halfMaxRetries = Math.floor(maxRetries / 2)
  const backoffFactor = 1.5 // gentle backoff

  let pollIndex = 0
  while (pollIndex < maxRetries) {
    // start backoff after half the retries
    const currentPollInterval =
      pollIndex < halfMaxRetries
        ? tradingApiPollingIntervalMs
        : tradingApiPollingIntervalMs * Math.pow(backoffFactor, pollIndex - halfMaxRetries)

    logger.debug('watchTransactionSaga', `[${lookupId}] waitForTransactionStatus`, 'polling for status', {
      pollIndex,
      currentPollInterval,
      isUserOp,
    })

    yield* delay(currentPollInterval)

    const data = yield* call(TradingApiClient.fetchSwaps, {
      ...(userOpHash ? { userOpHashes: [userOpHash] } : txHash ? { txHashes: [txHash] } : {}),
      chainId,
      swapper: transaction.from,
    })

    const swapItem = data.swaps?.[0]
    const currentSwapStatus = swapItem?.status

    if (swapItem?.txHash) {
      resolvedTxHash = swapItem.txHash
    }

    if (swapItem?.paymaster) {
      resolvedPaymaster = swapItem.paymaster
    }

    if (swapItem?.sponsorship) {
      resolvedSponsorInfo = swapItem.sponsorship
    }

    logger.debug(
      'watchTransactionSaga',
      `[${lookupId}] waitForTransactionStatus`,
      'currentSwapStatus:',
      currentSwapStatus,
    )
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

    if (updatedTransaction && updatedTransaction.status !== TransactionStatus.Pending) {
      logger.debug(
        'watchTransactionSaga',
        `[${transaction.id}] waitForTransactionStatus`,
        'Local update found: ',
        updatedTransaction.status,
      )

      return {
        status: updatedTransaction.status,
        txHash: resolvedTxHash,
        sponsorInfo: resolvedSponsorInfo,
        paymaster: resolvedPaymaster,
      }
    }

    pollIndex++
  }

  logger.debug('watchTransactionSaga', `[${transaction.id}] waitForTransactionStatus`, 'final swapStatus:', swapStatus)

  // SWAP-2471: distinguish a force-Failed (polling exhausted with NO terminal status) from a genuine
  // FAILED — a force-Failed tx may still mine later, leaving local state out of sync.
  if (!swapStatus) {
    logger.warn('watchTransactionSaga', 'waitForTransactionStatus', 'Polling exhausted; defaulting to Failed', {
      transactionId: transaction.id,
      txHash: resolvedTxHash,
      isUserOp,
      maxRetries,
    })
    // SWAP-2471: surface the force-Failed (poll-exhausted) outcome as an unsampled event too — it may
    // still mine later, so local state can drift. isClassic narrows to the OnChain tx the builder needs.
    if (isClassic(transaction)) {
      yield* call(
        sendAnalyticsEvent,
        WalletEventName.PendingTransactionStuck,
        // provider_knows_tx omitted: this is the Trading-API poll path with no chain provider in scope,
        // so we never probed whether the provider knows the tx — emitting false would mislead (SWAP-2471).
        buildPendingTransactionStuckProperties({
          transaction,
          reason: 'poll_exhausted',
          nowMs: Date.now(),
        }),
      )
    }
  }

  // If we didn't get a status after polling, assume it's failed.
  // Classic swaps still have provider.waitForTransaction(hash) if the tx lands on-chain later, which will override this status
  return {
    status: swapStatus ? SWAP_STATUS_TO_TX_STATUS[swapStatus] : TransactionStatus.Failed,
    txHash: resolvedTxHash,
    sponsorInfo: resolvedSponsorInfo,
    paymaster: resolvedPaymaster,
  }
}
