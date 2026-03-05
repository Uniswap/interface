import { call } from 'typed-redux-saga'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { ToucanWithdrawBidAndClaimTokensTransactionStep } from 'uniswap/src/features/transactions/toucan/steps/withdrawBidAndClaimTokens'
import { createSaga } from 'uniswap/src/utils/saga'
import { popupRegistry } from '~/components/Popups/registry'
import { PopupType } from '~/components/Popups/types'
import { WithdrawBidAndClaimTokensToucanBidParams } from '~/state/sagas/toucan/types'
import { handleOnChainStep } from '~/state/sagas/transactions/utils'

function* withdrawBidAndClaimTokensToucanBid(params: WithdrawBidAndClaimTokensToucanBidParams) {
  const { account, txRequest, setCurrentStep, selectChain, onSuccess, onFailure, info, analytics } = params

  try {
    const chainSwitched = yield* call(selectChain, txRequest.chainId)
    if (!chainSwitched) {
      onFailure(new Error('Failed to switch networks for Toucan withdraw'))
      return
    }

    const step: ToucanWithdrawBidAndClaimTokensTransactionStep = {
      type: TransactionStepType.ToucanWithdrawBidAndClaimTokensTransactionStep,
      txRequest,
    }

    const hash = yield* call(handleOnChainStep, {
      address: account.address,
      step,
      info,
      setCurrentStep,
      shouldWaitForConfirmation: false,
    })

    if (analytics) {
      sendAnalyticsEvent(AuctionEventName.AuctionWithdrawSubmitted, {
        ...analytics,
        transaction_hash: hash,
      })
    }

    popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash)
    onSuccess(hash)
  } catch (error) {
    const failure = error instanceof Error ? error : new Error('Failed to submit Toucan withdraw transaction')
    onFailure(failure)
  }
}

export const withdrawBidAndClaimTokensToucanBidSaga = createSaga(
  withdrawBidAndClaimTokensToucanBid,
  'withdrawBidAndClaimTokensToucanBidSaga',
)
