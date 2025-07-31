import { providers } from 'ethers'
import { SagaGenerator, call, delay, put, select } from 'typed-redux-saga'
import { fetchSwaps } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { SwapStatus } from 'uniswap/src/data/tradingApi/__generated__'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { makeSelectTransaction } from 'uniswap/src/features/transactions/selectors'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { buildNetworkFeeFromReceipt } from 'wallet/src/features/transactions/utils'
import {
  FINALIZED_SWAP_STATUS,
  SWAP_STATUS_TO_TX_STATUS,
} from 'wallet/src/features/transactions/watcher/transactionSagaUtils'

function withTimeout<T>(promise: Promise<T>, opts: { timeoutMs: number; errorMsg: string }): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(opts.errorMsg)), opts.timeoutMs)),
  ])
}

export async function waitForReceipt(
  hash: string,
  provider: providers.Provider,
): Promise<providers.TransactionReceipt> {
  const txReceipt = await withTimeout(provider.waitForTransaction(hash), {
    timeoutMs: ONE_MINUTE_MS * 5,
    errorMsg: 'Timed out waiting for transaction receipt',
  })

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (txReceipt) {
    logger.debug('watchOnChainTransactionSaga', 'waitForReceipt', 'Tx receipt received', hash)
  }

  return txReceipt
}

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

export function* updateTransactionStatusNetworkFee(
  transaction: RequireNonNullable<TransactionDetails, 'hash'>,
  provider: providers.Provider,
) {
  const ethersReceipt = yield* call(waitForReceipt, transaction.hash, provider)
  const { nativeCurrency } = getChainInfo(transaction.chainId)

  const networkFee = buildNetworkFeeFromReceipt({
    receipt: ethersReceipt,
    nativeCurrency,
    chainId: transaction.chainId,
  })

  // wait for trading api to update the transaction status
  const updatedTransactionWithoutNetworkFee = yield* call(waitForTransactionInStore, transaction)
  const updatedTransaction = { ...updatedTransactionWithoutNetworkFee, networkFee }
  yield* put(transactionActions.updateTransactionWithoutWatch(updatedTransaction))
}

/**
 * Polls the backend API to determine the final status of a transaction
 * @param transaction The transaction details.
 * @returns The final TransactionStatus based on the backend polling.
 */
export function* waitForTransactionStatus(transaction: TransactionDetails): SagaGenerator<TransactionStatus> {
  const txHash = transaction.hash
  const chainId = toTradingApiSupportedChainId(transaction.chainId)

  if (!txHash || !chainId) {
    return TransactionStatus.Unknown
  }

  const { tradingApiPollingIntervalMs } = getChainInfo(transaction.chainId)
  let swapStatus: SwapStatus | undefined
  const maxRetries = 10
  const halfMaxRetries = Math.floor(maxRetries / 2)
  const backoffFactor = 1.5 // gentle backoff

  let pollIndex = 0
  while (pollIndex < maxRetries) {
    // start backoff after half the retries
    const currentPollInterval =
      pollIndex < halfMaxRetries
        ? tradingApiPollingIntervalMs
        : tradingApiPollingIntervalMs * Math.pow(backoffFactor, pollIndex - halfMaxRetries)

    logger.debug('watchTransactionSaga', `[${txHash}] waitForTransactionStatus`, 'polling for status', {
      pollIndex,
      currentPollInterval,
    })

    yield* delay(currentPollInterval)

    const data = yield* call(fetchSwaps, {
      txHashes: [txHash],
      chainId,
    })

    const currentSwapStatus = data.swaps?.[0]?.status
    logger.debug(
      'watchTransactionSaga',
      `[${txHash}] waitForTransactionStatus`,
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

      return updatedTransaction.status
    }

    pollIndex++
  }

  logger.debug('watchTransactionSaga', `[${transaction.id}] waitForTransactionStatus`, 'final swapStatus:', swapStatus)
  // If we didn't get a status after polling, assume it's failed
  return swapStatus ? SWAP_STATUS_TO_TX_STATUS[swapStatus] : TransactionStatus.Failed
}
