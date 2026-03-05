import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { PlanResponse } from '@universe/api/src/clients/trading/__generated__/models/PlanResponse'
import { useEffect } from 'react'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TradingApiSessionClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiSessionClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { usePollingIntervalByChain } from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'
import { transformPlanResponse } from 'uniswap/src/features/transactions/swap/plan/planSagaUtils'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { tradingApiToUniverseChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { useEvent, usePrevious } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { queryWithoutCache } from 'utilities/src/reactQuery/queryOptions'
import { useStore } from 'zustand'

function useActivePlanQuery(params: {
  activePlanId?: string
  activeStepChainId?: UniverseChainId
  enabled: boolean
}): UseQueryResult<PlanResponse | undefined, Error> {
  const { activePlanId, activeStepChainId, enabled } = params
  const pollingInterval = usePollingIntervalByChain(activeStepChainId)

  return useQuery(
    // Plans should always be fresh, so we query without cache.
    queryWithoutCache({
      queryKey: [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.plan, 'refresh', activePlanId],
      queryFn: () =>
        activePlanId
          ? TradingApiSessionClient.refreshExistingPlan({ planId: activePlanId })
          : Promise.resolve(undefined),
      refetchInterval: pollingInterval,
      enabled: enabled && Boolean(params.activePlanId),
    }),
  )
}

export function ActivePlanUpdater(): null {
  const activePlanId = useStore(activePlanStore, (state) => state.activePlan?.planId)
  const activeStepChainId = useStore(activePlanStore, (state) => {
    const plan = state.activePlan
    if (!plan) {
      return undefined
    }
    return tradingApiToUniverseChainId(plan.steps[plan.currentStepIndex]?.tokenInChainId)
  })
  const resumePlanSwapFormState = useStore(activePlanStore, (state) => state.resumePlanSwapFormState)
  // Compare against the active plan's planId so a backgrounded Plan A's lock doesn't suppress polling for an unrelated active Plan B.
  const isPlanExecutionLocked = useStore(
    activePlanStore,
    (state) => state.executionLockPlanId != null && state.executionLockPlanId === state.activePlan?.planId,
  )
  const isSubmitting = useSwapFormStore((state) => state.isSubmitting)
  const updateSwapForm = useSwapFormStore((state) => state.updateSwapForm)

  const activePlanQuery = useActivePlanQuery({
    activePlanId,
    activeStepChainId,
    enabled: !isSubmitting && !isPlanExecutionLocked,
  })

  const { screen: currentScreen, setScreen } = useTransactionModalContext()
  const previousScreen = usePrevious(currentScreen)

  const updateActivePlan = useEvent((data: PlanResponse) => {
    // Skip updates while the saga is executing — it manages plan state directly and stale poll responses could overwrite its calldata.
    if (isSubmitting || isPlanExecutionLocked) {
      return
    }

    const transformedResponse = transformPlanResponse(data)

    activePlanStore.setState({
      activePlan: {
        response: data,
        planId: data.planId,
        steps: transformedResponse.steps,
        proofPending: false,
        currentStepIndex: transformedResponse.currentStepIndex,
        inputChainId: transformedResponse.inputChainId,
      },
    })
  })

  useEffect(() => {
    if (resumePlanSwapFormState) {
      // Populate form
      updateSwapForm(resumePlanSwapFormState)
      // Consume the resume plan swap form state so that is does not trigger again.
      activePlanStore.setState({ resumePlanSwapFormState: undefined })
      // Navigate to the review screen
      setScreen(TransactionScreen.Review)
    }
  }, [resumePlanSwapFormState, setScreen, updateSwapForm])

  useEffect(() => {
    if (activePlanQuery.data) {
      updateActivePlan(activePlanQuery.data)
    }
  }, [activePlanQuery.data, updateActivePlan])

  useEffect(() => {
    if (previousScreen === TransactionScreen.Review && currentScreen !== TransactionScreen.Review) {
      if (isSubmitting && activePlanId) {
        activePlanStore.getState().actions.backgroundPlan(activePlanId)
      }
      activePlanStore.getState().actions.resetActivePlan()
    }
  }, [currentScreen, previousScreen, isSubmitting, activePlanId])

  return null
}
