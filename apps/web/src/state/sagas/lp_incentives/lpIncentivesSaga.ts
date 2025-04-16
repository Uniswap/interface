import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { LpIncentivesClaimParams } from 'state/sagas/lp_incentives/types'
import { handleOnChainStep } from 'state/sagas/transactions/utils'
import {
  LpIncentivesClaimTransactionInfo,
  LpIncentivesClaimTransactionStep,
  TransactionType,
} from 'state/transactions/types'
import { call } from 'typed-redux-saga'
import { TransactionStepType } from 'uniswap/src/features/transactions/swap/types/steps'
import { createSaga } from 'uniswap/src/utils/saga'

function* lpIncentivesClaim(params: LpIncentivesClaimParams) {
  const { account, claimData, chainId, tokenAddress, selectChain, onSuccess, onFailure, setCurrentStep } = params

  try {
    if (!claimData.claim) {
      throw new Error('No claim data provided')
    }

    // Check if we need to switch chains
    if (claimData.claim.chainId !== chainId) {
      const chainSwitched = yield* call(selectChain, claimData.claim.chainId)
      if (!chainSwitched) {
        onFailure(new Error('Failed to switch to Ethereum mainnet'))
        return
      }
    }

    const info: LpIncentivesClaimTransactionInfo = {
      type: TransactionType.LP_INCENTIVES_CLAIM_REWARDS,
      tokenAddress,
    }

    const step: LpIncentivesClaimTransactionStep = {
      type: TransactionStepType.CollectLpIncentiveRewardsTransactionStep,
      txRequest: claimData.claim,
    }

    const hash = yield* call(handleOnChainStep, {
      account,
      step,
      info,
      setCurrentStep,
      shouldWaitForConfirmation: false,
    })

    popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash)

    yield* call(onSuccess)
  } catch (error) {
    onFailure(error instanceof Error ? error : new Error('Failed to claim LP incentives'))
  }
}

export const lpIncentivesClaimSaga = createSaga(lpIncentivesClaim, 'lpIncentivesClaimSaga')
