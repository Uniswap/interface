import { call, take } from 'typed-redux-saga'
import { cancelRemoteUniswapXOrder } from 'uniswap/src/features/transactions/slice'
import { logger } from 'utilities/src/logger/logger'
import { getSigner } from '~/state/sagas/transactions/utils'
import { didUserReject } from '~/utils/swapErrorToUserReadableMessage'

type CancelRemoteUniswapXOrderAction = ReturnType<typeof cancelRemoteUniswapXOrder>

/**
 * Web handler for `cancelRemoteUniswapXOrder`: cancels UniswapX orders that only exist in the
 * remote activity feed (no local slice record), by submitting the Permit2 nonce invalidation
 * directly. Mirrors `handleCancelOrder` minus the slice status writes.
 *
 * Wallet platforms handle this action in `transactionWatcherSaga`; before this saga existed the
 * shared context menu's remote-order cancel was a silent no-op on web.
 */
export function* cancelRemoteOrderSaga() {
  while (true) {
    const { payload } = yield* take<CancelRemoteUniswapXOrderAction>(cancelRemoteUniswapXOrder.type)
    yield* call(handleCancelRemoteOrder, payload)
  }
}

export async function handleCancelRemoteOrder(payload: CancelRemoteUniswapXOrderAction['payload']): Promise<void> {
  const { address, chainId, orderHash, cancelRequest } = payload

  try {
    const signer = await getSigner(address)
    const response = await signer.sendTransaction(cancelRequest)
    logger.debug('cancelRemoteOrderSaga', 'handleCancelRemoteOrder', 'Remote order cancellation submitted', {
      chainId,
      orderHash,
      hash: response.hash,
    })
  } catch (error) {
    if (didUserReject(error)) {
      return
    }
    logger.error(error, {
      tags: { file: 'cancelRemoteOrderSaga', function: 'handleCancelRemoteOrder' },
      extra: { chainId, orderHash },
    })
  }
}
