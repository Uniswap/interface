import { put } from 'typed-redux-saga'
import { SwapStatus } from 'uniswap/src/data/tradingApi/__generated__'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * Delete transaction from state. Should be called when a transaction should no longer
 * be monitored. Often used when txn is replaced or cancelled.
 * @param transaction txn to delete from state
 */
export function* deleteTransaction(transaction: TransactionDetails): Generator<unknown> {
  yield* put(
    transactionActions.deleteTransaction({
      address: transaction.from,
      id: transaction.id,
      chainId: transaction.chainId,
    }),
  )
}

// Constants moved from the original file
export const SWAP_STATUS_TO_TX_STATUS: { [key in SwapStatus]: TransactionStatus } = {
  [SwapStatus.PENDING]: TransactionStatus.Pending,
  [SwapStatus.SUCCESS]: TransactionStatus.Success,
  [SwapStatus.NOT_FOUND]: TransactionStatus.Unknown,
  [SwapStatus.FAILED]: TransactionStatus.Failed,
  [SwapStatus.EXPIRED]: TransactionStatus.Expired,
}

export const FINALIZED_SWAP_STATUS = [SwapStatus.SUCCESS, SwapStatus.FAILED, SwapStatus.EXPIRED]
export const MIN_BRIDGE_WAIT_TIME = ONE_SECOND_MS * 3
