import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import type { LpIncentivesClaimParams } from 'state/sagas/lp_incentives/types'
import { handleOnChainStep } from 'state/sagas/transactions/utils'
import type { LpIncentivesClaimTransactionStep } from 'state/transactions/types'
import { call } from 'typed-redux-saga'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import type { LpIncentivesClaimTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
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
      type: TransactionType.LPIncentivesClaimRewards,
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
