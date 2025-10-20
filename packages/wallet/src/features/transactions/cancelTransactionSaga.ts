import { providers } from 'ethers'
import { call, select } from 'typed-redux-saga'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  TransactionDetails,
  TransactionOriginType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import {
  ExecuteTransactionParams,
  executeTransaction,
} from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { attemptReplaceTransaction } from 'wallet/src/features/transactions/replaceTransactionSaga'
import { selectAccounts } from 'wallet/src/features/wallet/selectors'
// Note, transaction cancellation on Ethereum is inherently flaky
// The best we can do is replace the transaction and hope the original isn't mined first
// Inspiration: https://github.com/MetaMask/metamask-extension/blob/develop/app/scripts/controllers/transactions/index.js#L744
export function* attemptCancelTransaction(
  transaction: TransactionDetails,
  cancelRequest: providers.TransactionRequest,
) {
  if (isClassic(transaction) || isBridge(transaction)) {
    yield* call(attemptReplaceTransaction, { transaction, newTxRequest: cancelRequest, isCancellation: true })
  } else if (isUniswapX(transaction)) {
    yield* call(cancelOrder, transaction, cancelRequest)
  }
}

function* cancelOrder(order: UniswapXOrderDetails, cancelRequest: providers.TransactionRequest) {
  const { orderHash, chainId } = order
  if (!orderHash) {
    return
  }

  try {
    const accounts = yield* select(selectAccounts)
    const checksummedAddress = getValidAddress({
      address: order.from,
      chainId,
      withEVMChecksum: true,
      log: false,
    })
    if (!checksummedAddress) {
      throw new Error(`Cannot cancel order, address is invalid: ${checksummedAddress}`)
    }
    const account = accounts[checksummedAddress]
    if (!account || account.type !== AccountType.SignerMnemonic) {
      throw new Error(`Cannot cancel order, account missing: ${orderHash}`)
    }

    // Create execute transaction parameters
    const executeTransactionParams: ExecuteTransactionParams = {
      chainId,
      account,
      options: {
        request: cancelRequest,
      },
      transactionOriginType: TransactionOriginType.Internal,
    }

    // UniswapX Orders are cancelled via submitting a transaction to invalidate the nonce of the permit2 signature used to fill the order.
    // If the permit2 tx is mined before a filler attempts to fill the order, the order is prevented; the cancellation is successful.
    // If the permit2 tx is mined after a filler successfully fills the order, the tx will succeed but have no effect; the cancellation is unsuccessful.
    yield* call(executeTransaction, executeTransactionParams)

    // At this point, there is no need to track the above transaction in state, as it will be mined regardless of whether the order is filled or not.
    // Instead, the transactionWatcherSaga will either receive 'cancelled' or 'success' from the backend, updating the original tx's UI accordingly.

    // Activity history UI will pick the above transaction up as a generic "Permit2" tx.
  } catch (error) {
    logger.error(error, {
      tags: { file: 'cancelTransactionSaga', function: 'cancelOrder' },
      extra: { orderHash },
    })
  }
}
