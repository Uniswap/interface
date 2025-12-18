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
  const { address, claimData, chainId, tokenAddress, selectChain, onSuccess, onFailure, setCurrentStep } = params

  try {
    // Check if we need to switch chains
    if (claimData.chainId !== chainId) {
      const chainSwitched = yield* call(selectChain, claimData.chainId)

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
      txRequest: claimData,
    }

    const hash = yield* call(handleOnChainStep, {
      address,
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
