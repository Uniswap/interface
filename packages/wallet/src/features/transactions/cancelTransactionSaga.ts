import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { CosignedV2DutchOrder, getCancelSingleParams } from '@uniswap/uniswapx-sdk'
import { Contract, providers } from 'ethers'
import { call, select } from 'typed-redux-saga'
import PERMIT2_ABI from 'uniswap/src/abis/permit2.json'
import { Permit2 } from 'uniswap/src/abis/types'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { getOrders } from 'wallet/src/features/transactions/orderWatcherSaga'
import { attemptReplaceTransaction } from 'wallet/src/features/transactions/replaceTransactionSaga'
import { signAndSendTransaction } from 'wallet/src/features/transactions/sendTransactionSaga'
import { getProvider, getSignerManager } from 'wallet/src/features/wallet/context'
import { selectAccounts } from 'wallet/src/features/wallet/selectors'

// Note, transaction cancellation on Ethereum is inherently flaky
// The best we can do is replace the transaction and hope the original isn't mined first
// Inspiration: https://github.com/MetaMask/metamask-extension/blob/develop/app/scripts/controllers/transactions/index.js#L744
export function* attemptCancelTransaction(
  transaction: TransactionDetails,
  cancelRequest: providers.TransactionRequest,
) {
  if (isClassic(transaction) || isBridge(transaction)) {
    yield* call(attemptReplaceTransaction, transaction, cancelRequest, true)
  } else if (isUniswapX(transaction)) {
    yield* call(cancelOrder, transaction, cancelRequest)
  }
}

function getPermit2Contract(): Permit2 {
  return new Contract(PERMIT2_ADDRESS, PERMIT2_ABI) as Permit2
}

export async function getCancelOrderTxRequest(
  tx: UniswapXOrderDetails,
): Promise<providers.TransactionRequest | undefined> {
  const { orderHash, chainId, from } = tx
  if (!orderHash) {
    return undefined
  } else {
    const { encodedOrder } = (await getOrders([orderHash])).orders[0] ?? {}
    if (!encodedOrder) {
      return undefined
    }

    const nonce = CosignedV2DutchOrder.parse(encodedOrder, chainId).info.nonce
    const cancelParams = getCancelSingleParams(nonce)

    const permit2 = getPermit2Contract()
    const cancelTx = await permit2.populateTransaction.invalidateUnorderedNonces(cancelParams.word, cancelParams.mask)
    return { ...cancelTx, from, chainId }
  }
}

function* cancelOrder(order: UniswapXOrderDetails, cancelRequest: providers.TransactionRequest) {
  const { orderHash, chainId } = order
  if (!orderHash) {
    return
  }

  try {
    const accounts = yield* select(selectAccounts)
    const checksummedAddress = getValidAddress(order.from, true, false)
    if (!checksummedAddress) {
      throw new Error(`Cannot cancel order, address is invalid: ${checksummedAddress}`)
    }
    const account = accounts[checksummedAddress]
    if (!account) {
      throw new Error(`Cannot cancel order, account missing: ${orderHash}`)
    }
    const signerManager = yield* call(getSignerManager)
    const provider = yield* call(getProvider, chainId)

    // UniswapX Orders are cancelled via submitting a transaction to invalidate the nonce of the permit2 signature used to fill the order.
    // If the permit2 tx is mined before a filler attempts to fill the order, the order is prevented; the cancellation is successful.
    // If the permit2 tx is mined after a filler successfully fills the order, the tx will succeed but have no effect; the cancellation is unsuccessful.
    yield* call(signAndSendTransaction, cancelRequest, account, provider, signerManager)

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
