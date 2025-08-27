import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

const MS = 1000
const ONE_MINUTE_MS = 60 * MS
const TWO_SECONDS_MS = 2 * MS
const FIVE_MINUTES_MS = 5 * ONE_MINUTE_MS

/**
 * Shared constants for transaction polling
 */
export const POLLING_CONSTANTS = {
  /** Default polling interval in milliseconds */
  POLL_INTERVAL: TWO_SECONDS_MS,
  /** Maximum time to poll for a transaction receipt */
  MAX_POLLING_TIME: FIVE_MINUTES_MS, // 5 minutes
  /** Block intervals for different transaction ages */
  BLOCKS_BEFORE_CHECK: {
    /** Check every block for recent transactions (< 5 minutes) */
    RECENT: 1,
    /** Check every 3 blocks for medium-aged transactions (5-60 minutes) */
    MEDIUM: 3,
    /** Check every 10 blocks for old transactions (> 60 minutes) */
    OLD: 10,
  },
  /** Time thresholds in minutes */
  TIME_THRESHOLDS_MINUTES: {
    /** Medium-aged transaction threshold in minutes */
    MEDIUM: 5,
    /** Old transaction threshold in minutes */
    OLD: 60,
  },
} as const

/**
 * Shared transaction polling utilities and constants
 * Used by both web and wallet packages for smart transaction polling
 *
 * This file contains the shared logic for determining when to poll for transaction
 * receipts based on block numbers and transaction age. The logic is identical
 * between web and wallet packages, so it's extracted here to avoid duplication.
 */

/**
 * Smart polling logic that optimizes transaction checking based on lastCheckedBlockNumber
 * Determines whether a transaction should be checked based on:
 * - If it already has a receipt (no need to check)
 * - How many blocks have passed since last check
 * - How long the transaction has been pending
 */
export function shouldCheckTransaction(
  lastBlockNumber: number,
  transaction: Pick<TransactionDetails, 'receipt' | 'lastCheckedBlockNumber' | 'addedTime'>,
): boolean {
  if (transaction.receipt) {
    return false
  }
  if (!transaction.lastCheckedBlockNumber) {
    return true
  }
  const { TIME_THRESHOLDS_MINUTES, BLOCKS_BEFORE_CHECK } = POLLING_CONSTANTS
  const blocksSinceCheck = lastBlockNumber - transaction.lastCheckedBlockNumber
  if (blocksSinceCheck < BLOCKS_BEFORE_CHECK.RECENT) {
    return false
  }
  const minutesPending = (Date.now() - transaction.addedTime) / (60 * 1000)
  if (minutesPending > TIME_THRESHOLDS_MINUTES.OLD) {
    // every 10 blocks if pending longer than an hour
    return blocksSinceCheck >= BLOCKS_BEFORE_CHECK.OLD
  } else if (minutesPending > TIME_THRESHOLDS_MINUTES.MEDIUM) {
    // every 3 blocks if pending longer than 5 minutes
    return blocksSinceCheck >= BLOCKS_BEFORE_CHECK.MEDIUM
  } else {
    // otherwise every block
    return true
  }
}

/**
 * Timeout utility for promises with custom error messages
 */
export function withTimeout<T>(promise: Promise<T>, opts: { timeoutMs: number; errorMsg: string }): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(opts.errorMsg)), opts.timeoutMs)),
  ])
}
