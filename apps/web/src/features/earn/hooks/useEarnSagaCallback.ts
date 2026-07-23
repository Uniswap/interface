import { type Currency } from '@uniswap/sdk-core'
import type { ChainedQuoteResponse, TradingApi } from '@universe/api'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import {
  buildEarnChainedActionTrade,
  buildEarnPlanAnalytics,
  buildEarnSwapTxContext,
  EarnPlanPriceChangeError,
} from 'uniswap/src/features/earn/planExecution'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { planActions } from 'uniswap/src/features/transactions/swap/plan/planSaga'
import {
  PlanPriceChangeInterrupt,
  type PlanFinalizedCallbackParams,
} from 'uniswap/src/features/transactions/swap/plan/types'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { signalEarnModalClosed } from 'uniswap/src/utils/saga'
import { useAccountsStore, useActiveAccount } from '~/features/accounts/store/hooks'
import { useSelectChain } from '~/hooks/useSelectChain'
import { handleEarnPlanTransactionStep, handleEarnPlanWalletCallStep } from '~/state/sagas/transactions/earnSaga'
import { handleUniswapXPlanSignatureStep } from '~/state/sagas/transactions/uniswapx'
import {
  getDisplayableError,
  handleApprovalTransactionStep,
  handleSignatureStep,
  sendToast,
} from '~/state/sagas/transactions/utils'

export interface EarnCallbackParams {
  earnIntent: TradingApi.EarnIntent
  inputCurrency: Currency
  outputCurrency: Currency
  quote: ChainedQuoteResponse
  onSuccess: () => void
  onFailure: (error?: Error, onPressRetry?: () => void) => void
  onSubmitted?: () => void
  onPlanFinalized?: (params: PlanFinalizedCallbackParams) => void
}

type EarnSagaCallback = (params: EarnCallbackParams) => void

export function useEarnSagaCallback(): EarnSagaCallback {
  const { t } = useTranslation()
  const appDispatch = useDispatch()
  const selectChain = useSelectChain()
  const evmAccount = useActiveAccount(Platform.EVM)

  const caip25Info = useAccountsStore((state) => {
    return state.getActiveConnector(Platform.EVM)?.session?.caip25Info
  })

  return useCallback(
    (params: EarnCallbackParams) => {
      const { earnIntent, inputCurrency, outputCurrency, quote, onSuccess, onFailure } = params

      if (!evmAccount) {
        onFailure(new Error('No connected EVM account'))
        return
      }

      let trade: ReturnType<typeof buildEarnChainedActionTrade>
      try {
        trade = buildEarnChainedActionTrade({
          quote,
          currencyIn: inputCurrency,
          currencyOut: outputCurrency,
          earnIntent,
        })
      } catch (error) {
        onFailure(error instanceof Error ? error : new Error('Unable to build earn trade'))
        return
      }
      const swapTxContext = buildEarnSwapTxContext(trade)
      const analytics = buildEarnPlanAnalytics(trade)
      const activePlanState = activePlanStore.getState()
      const interruptedPlanId = activePlanState.activePlan?.planId

      if (interruptedPlanId && activePlanState.priceChangeInterruptedPlanIds.has(interruptedPlanId)) {
        activePlanState.actions.clearPriceChangeInterrupted(interruptedPlanId)
      }

      params.onSubmitted?.()
      appDispatch(
        planActions.trigger({
          address: evmAccount.address,
          swapTxContext,
          analytics,
          setCurrentStep: () => {},
          setSteps: () => {},
          onPending: () => {},
          onClearForm: () => {},
          selectChain,
          caip25Info,
          handleApprovalTransactionStep,
          handleSwapTransactionStep: handleEarnPlanTransactionStep,
          handleSwapTransactionWalletCallStep: handleEarnPlanWalletCallStep,
          handleSignatureStep,
          handleUniswapXPlanSignatureStep,
          // Earn review has no accept-new-price prompt.
          getDisplayableError: (args) =>
            args.error instanceof PlanPriceChangeInterrupt
              ? new EarnPlanPriceChangeError(t('explore.earn.review.priceChanged'))
              : getDisplayableError({ ...args, isPlanStep: true }),
          sendToast,
          modalClosedActionType: signalEarnModalClosed.type,
          onSuccess,
          onFailure,
          onPlanFinalized: params.onPlanFinalized,
        }),
      )
    },
    [appDispatch, caip25Info, evmAccount, selectChain, t],
  )
}
