import { call } from 'typed-redux-saga'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { ToucanBidTransactionStep } from 'uniswap/src/features/transactions/toucan/steps/submitBid'
import { createSaga } from 'uniswap/src/utils/saga'
import { popupRegistry } from '~/components/Popups/registry'
import { PopupType } from '~/components/Popups/types'
import { SubmitToucanBidParams } from '~/state/sagas/toucan/types'
import {
  handleApprovalTransactionStep,
  handleOnChainStep,
  handlePermitTransactionStep,
  handleSignatureStep,
} from '~/state/sagas/transactions/utils'

function* submitToucanBid(params: SubmitToucanBidParams) {
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
  } = params

  try {
    const chainSwitched = yield* call(selectChain, txRequest.chainId)
    if (!chainSwitched) {
      onFailure(new Error('Failed to switch networks for Toucan bid'))
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
            if (!shouldContinue) {
              onFailure(new Error('Bid simulation failed after permit steps'))
              return
            }
            didRunPostPermitSimulation = true
          }

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
      if (analytics) {
        sendAnalyticsEvent(AuctionEventName.AuctionBidSubmitted, {
          ...analytics,
          transaction_hash: bidHash,
        })
      }

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
