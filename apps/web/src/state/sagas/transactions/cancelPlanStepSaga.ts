import type { TransactionRequest } from '@ethersproject/abstract-provider'
import { call, take } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CancelableStepInfo } from 'uniswap/src/features/transactions/hooks/useIsCancelable'
import { cancelPlanStep } from 'uniswap/src/features/transactions/slice'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { signalPlanCancellation } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import store from '~/state'
import { handleCancelOrder } from '~/state/sagas/transactions/cancelOrderSaga'

interface CancelPlanStepPayload {
  chainId: UniverseChainId
  id: string
  address: string
  cancelRequest: TransactionRequest
  planId: string
  cancelableStepInfo: CancelableStepInfo
}

/**
 * Saga to cancel a step within a plan on web.
 *
 * This saga listens for `cancelPlanStep` actions from the Redux slice and executes
 * the cancellation transaction for UniswapX orders (permit2 nonce invalidation).
 *
 * For classic swaps, the plan is marked as cancelled to stop future steps, but no
 * cancellation transaction is submitted (the user must wait for the transaction to
 * complete or be dropped from the mempool).
 */
export function* cancelPlanStepSaga() {
  while (true) {
    const { payload } = yield* take<ReturnType<typeof cancelPlanStep>>(cancelPlanStep.type)
    yield* call(handleCancelPlanStep, payload)
  }
}

async function handleCancelPlanStep(payload: CancelPlanStepPayload): Promise<void> {
  const { planId, cancelRequest, cancelableStepInfo, address } = payload
  const { step, stepIndex, cancellationType } = cancelableStepInfo

  logger.debug('cancelPlanStepSaga', 'handleCancelPlanStep', 'Attempting to cancel plan step', {
    planId,
    stepIndex,
    cancellationType,
    stepHash: step.hash,
    orderId: cancelableStepInfo.orderId,
  })

  // Mark plan as cancelled in store to stop saga from executing future steps
  activePlanStore.getState().actions.markPlanCancelled(planId)

  // Signal cancellation to interrupt watchPlanStep if it's waiting
  store.dispatch(signalPlanCancellation({ planId }))

  // Classic swaps cannot be cancelled on web - plan is already marked cancelled above
  // which will stop future steps from executing
  if (cancellationType === 'classic') {
    logger.debug('cancelPlanStepSaga', 'handleCancelPlanStep', 'Classic swap cancellation not supported on web', {
      planId,
      stepIndex,
    })
    return
  }

  try {
    if (!cancelableStepInfo.orderId) {
      throw new Error('Cannot cancel UniswapX step without orderId')
    }

    await handleCancelOrder({
      cancelRequest,
      id: cancelableStepInfo.orderId,
      address,
      chainId: step.chainId,
    })
  } catch (error) {
    logger.error(error, {
      tags: { file: 'cancelPlanStepSaga', function: 'handleCancelPlanStep' },
      extra: { planId, stepIndex, cancellationType },
    })
  }
}
