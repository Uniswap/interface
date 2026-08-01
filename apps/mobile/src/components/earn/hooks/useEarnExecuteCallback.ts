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
import {
  PlanPriceChangeInterrupt,
  type PlanFinalizedCallbackParams,
} from 'uniswap/src/features/transactions/swap/plan/types'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { signalEarnModalClosed } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { noop } from 'utilities/src/react/noop'
import { useAccountsStore, useActiveAddress } from 'wallet/src/features/accounts/store/hooks'
import { executePlanActions } from 'wallet/src/features/transactions/swap/configuredSagas'

export interface MobileEarnExecuteParams {
  earnIntent: TradingApi.EarnIntent
  inputCurrency: Currency
  outputCurrency: Currency
  quote: ChainedQuoteResponse
  onSuccess: () => void
  onFailure: (error?: Error) => void
  onSubmitted?: () => void
  onPlanFinalized?: (params: PlanFinalizedCallbackParams) => void
}

export type MobileEarnExecuteCallback = (params: MobileEarnExecuteParams) => void

export function useEarnExecuteCallback(): MobileEarnExecuteCallback {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const evmAddress = useActiveAddress(Platform.EVM)
  const caip25Info = useAccountsStore((state) => state.getActiveConnector(Platform.EVM).session?.caip25Info)

  return useCallback(
    (params: MobileEarnExecuteParams) => {
      if (!evmAddress) {
        params.onFailure(new Error('No connected EVM account'))
        return
      }

      const activePlanState = activePlanStore.getState()
      const existingActivePlan = activePlanState.activePlan
      const interruptedPlanId = existingActivePlan?.planId
      const isPriceChangeInterrupted =
        !!interruptedPlanId && activePlanState.priceChangeInterruptedPlanIds.has(interruptedPlanId)

      if (existingActivePlan && !isPriceChangeInterrupted) {
        params.onFailure(new Error('A transaction is already in progress'))
        return
      }

      let trade: ReturnType<typeof buildEarnChainedActionTrade>
      try {
        trade = buildEarnChainedActionTrade({
          quote: params.quote,
          currencyIn: params.inputCurrency,
          currencyOut: params.outputCurrency,
          earnIntent: params.earnIntent,
        })
      } catch (error) {
        params.onFailure(error instanceof Error ? error : new Error('Unable to build earn trade'))
        return
      }

      if (interruptedPlanId && isPriceChangeInterrupted) {
        activePlanState.actions.clearPriceChangeInterrupted(interruptedPlanId)
      }

      params.onSubmitted?.()
      dispatch(
        executePlanActions.trigger({
          address: evmAddress,
          swapTxContext: buildEarnSwapTxContext(trade),
          analytics: buildEarnPlanAnalytics(trade),
          caip25Info,
          setCurrentStep: noop,
          setSteps: noop,
          onPending: noop,
          onClearForm: noop,
          onSuccess: params.onSuccess,
          onFailure: params.onFailure,
          onPlanFinalized: params.onPlanFinalized,
          modalClosedActionType: signalEarnModalClosed.type,
          // Mobile Earn has no accept-new-price prompt.
          getDisplayableError: ({ error }: { error: Error }) => {
            if (error instanceof PlanPriceChangeInterrupt) {
              return new EarnPlanPriceChangeError(t('explore.earn.review.priceChanged'))
            }

            logger.error(error, {
              tags: { file: 'useEarnExecuteCallback', function: 'getDisplayableError' },
            })

            return new Error(error.message)
          },
        }),
      )
    },
    [caip25Info, dispatch, evmAddress, t],
  )
}
