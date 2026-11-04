import { Level } from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'
import { call } from 'typed-redux-saga'
import { fetchGasFeeQuery } from 'uniswap/src/data/apiClients/gasService/useGasFeeQuery'
import { GAS_SPEED_STRATEGIES, GasSpeed } from 'uniswap/src/features/gas/utils'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { createSwapTransactionStepWalletCall } from 'uniswap/src/features/transactions/swap/steps/swap'
import { ToucanBidTransactionStep } from 'uniswap/src/features/transactions/toucan/steps/submitBid'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { createSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { promiseTimeout } from 'utilities/src/time/timing'
import { SubmitToucanBidParams } from '~/state/sagas/toucan/types'
import { handleAtomicSendCalls } from '~/state/sagas/transactions/5792'
import {
  handleApprovalTransactionStep,
  handleOnChainStep,
  handlePermitTransactionStep,
  handleSignatureStep,
} from '~/state/sagas/transactions/utils'
import { popupRegistry } from '~/utils/popups/registry'
import { PopupType } from '~/utils/popups/types'

// Bounds the wait before the wallet prompt; the gas service call has no timeout of its own.
const BID_GAS_ESTIMATE_TIMEOUT_MS = 5_000

/**
 * Sets the bid's gas limit from a send-time gas-service estimate (urgent strategy, so the limit is
 * inflated). A CCA bid's cost grows with auction state (checkpoint catch-up, ticks walked), so a
 * wallet's unpadded estimate can go stale within a block and the bid runs out of gas. Runs after the
 * pre-bid approval/permit steps, since the bid can't be simulated before them. Only `gasLimit` is
 * set; fee selection stays with the wallet. Returns the tx unchanged when no estimate comes back in
 * time, so the wallet's own estimation stays the fallback.
 */
async function populateBidGasLimit(tx: ValidatedTransactionRequest): Promise<ValidatedTransactionRequest> {
  try {
    const gasFee = await promiseTimeout(
      fetchGasFeeQuery({
        tx,
        gasStrategy: GAS_SPEED_STRATEGIES[GasSpeed.Urgent],
        urgency: { level: Level.URGENT },
        // Only read when no explicit gasStrategy is passed.
        isStatsigReady: true,
      }),
      BID_GAS_ESTIMATE_TIMEOUT_MS,
    )
    const gasLimit = gasFee?.params?.gasLimit
    if (!gasLimit) {
      logger.warn(
        'submitBidSaga',
        'populateBidGasLimit',
        'No gas limit from the gas service (empty or timed out); wallet will estimate',
      )
      return tx
    }
    return { ...tx, gasLimit }
  } catch (error) {
    // Message only: the raw error can carry the request, i.e. the bidder's address and calldata.
    logger.warn('submitBidSaga', 'populateBidGasLimit', 'Gas service failed; wallet will estimate', {
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    return tx
  }
}

/** The pre-bid steps' transactions, or undefined when one is not a plain transaction (a signature) and so can't join a batch. */
export function getBatchablePreBidTxRequests(
  preBidSteps: TransactionStep[],
): ValidatedTransactionRequest[] | undefined {
  const txRequests: ValidatedTransactionRequest[] = []
  for (const step of preBidSteps) {
    switch (step.type) {
      case TransactionStepType.TokenRevocationTransaction:
      case TransactionStepType.TokenApprovalTransaction:
      case TransactionStepType.Permit2Transaction:
        txRequests.push(step.txRequest)
        break
      default:
        return undefined
    }
  }
  return txRequests
}

function sendBidSubmittedAnalytics(analytics: SubmitToucanBidParams['analytics'], hash: string): void {
  if (analytics) {
    sendAnalyticsEvent(AuctionEventName.AuctionBidSubmitted, { ...analytics, transaction_hash: hash })
  }
}

export function* submitToucanBid(params: SubmitToucanBidParams) {
  const {
    account,
    txRequest,
    setCurrentStep,
    selectChain,
    onSuccess,
    onFailure,
    info,
    preBidSteps,
    setSteps,
    analytics,
    onPreBidStepsComplete,
    canBatchTransactions,
    disableOneClickSwap,
  } = params

  try {
    const chainSwitched = yield* call(selectChain, txRequest.chainId)
    if (!chainSwitched) {
      onFailure(new Error('Failed to switch networks for Toucan bid'))
      return
    }

    // A post-permit check has nowhere to run inside a batch, so a caller that asks for one gets the steps in turn.
    const batchablePreBidTxRequests =
      canBatchTransactions && !onPreBidStepsComplete && preBidSteps?.length
        ? getBatchablePreBidTxRequests(preBidSteps)
        : undefined
    if (batchablePreBidTxRequests) {
      // One wallet prompt for the approvals and the bid. A batch call carries no gas limit, so the
      // wallet estimates the bid's gas here; handleAtomicSendCalls adds the activity popup.
      const batchId = yield* call(handleAtomicSendCalls, {
        address: account.address,
        info,
        step: createSwapTransactionStepWalletCall([...batchablePreBidTxRequests, txRequest]),
        setCurrentStep,
        shouldWaitForConfirmation: false,
        disableOneClickSwap,
      })
      sendBidSubmittedAnalytics(analytics, batchId)
      onSuccess(batchId)
      return
    }

    const step: ToucanBidTransactionStep = {
      type: TransactionStepType.ToucanBidTransactionStep,
      txRequest,
    }

    const steps: TransactionStep[] = [...(preBidSteps ?? []), step]
    setSteps?.(steps)

    let bidHash: string | undefined
    // Tracks whether the post-permit2 simulation callback has been invoked.
    // This ensures the callback runs exactly once, even if there are multiple
    // ToucanBidTransactionStep entries (defensive, shouldn't happen in practice).
    let didRunPostPermitSimulation = false
    for (const currentStep of steps) {
      switch (currentStep.type) {
        case TransactionStepType.TokenRevocationTransaction:
        case TransactionStepType.TokenApprovalTransaction: {
          yield* call(handleApprovalTransactionStep, { address: account.address, step: currentStep, setCurrentStep })
          break
        }
        case TransactionStepType.Permit2Signature: {
          yield* call(handleSignatureStep, { address: account.address, step: currentStep, setCurrentStep })
          break
        }
        case TransactionStepType.Permit2Transaction: {
          yield* call(handlePermitTransactionStep, { address: account.address, step: currentStep, setCurrentStep })
          break
        }
        case TransactionStepType.ToucanBidTransactionStep: {
          // Run post-permit2 simulation if we had pre-bid steps and callback is provided
          if (!didRunPostPermitSimulation && preBidSteps && preBidSteps.length > 0 && onPreBidStepsComplete) {
            const shouldContinue = yield* call(onPreBidStepsComplete)
            // oxlint-disable-next-line max-depth
            if (!shouldContinue) {
              onFailure(new Error('Bid simulation failed after permit steps'))
              return
            }
            didRunPostPermitSimulation = true
          }

          // Set on the step itself (not a copy): the progress indicator matches steps by identity.
          currentStep.txRequest = yield* call(populateBidGasLimit, currentStep.txRequest)

          bidHash = yield* call(handleOnChainStep, {
            address: account.address,
            step: currentStep,
            info,
            setCurrentStep,
            shouldWaitForConfirmation: false,
          })
          break
        }
      }
    }

    if (bidHash) {
      sendBidSubmittedAnalytics(analytics, bidHash)
      popupRegistry.addPopup({ type: PopupType.Transaction, hash: bidHash }, bidHash)
      onSuccess(bidHash)
    } else {
      onFailure(new Error('Failed to submit Toucan bid transaction'))
    }
  } catch (error) {
    const failure = error instanceof Error ? error : new Error('Failed to submit Toucan bid transaction')
    onFailure(failure)
  }
}

export const submitToucanBidSaga = createSaga(submitToucanBid, 'submitToucanBidSaga')
