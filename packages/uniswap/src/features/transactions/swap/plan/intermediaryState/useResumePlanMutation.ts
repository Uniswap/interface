import { UseMutationResult, useMutation } from '@tanstack/react-query'
import { TradingApi } from '@universe/api'
import { NavigateToSwapFlowArgs, useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { TradingApiSessionClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiSessionClient'
import { AssetType } from 'uniswap/src/entities/assets'
import { extractPlanResponseAssetDetails } from 'uniswap/src/features/activity/extract/extractPlanResponseDetails'
import { getEarnPlanReuseIdentityFromPlanResponse } from 'uniswap/src/features/transactions/swap/plan/earnPlanReuseIdentity'
import { transformPlanResponse, updateGlobalPlanState } from 'uniswap/src/features/transactions/swap/plan/planSagaUtils'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

interface UseResumePlanParams {
  planId: string
  inputCurrencyId: string
  outputCurrencyId: string
  inputCurrencyAmount: string
  earnAction?: TradingApi.EarnAction
  isEarnActivityDisplayEnabled?: boolean
}

/** Mutation for fetching a plan and navigating to swap with the plan loaded. */
export function useResumePlanMutation({
  successCallback,
}: {
  successCallback?: () => void
}): UseMutationResult<NavigateToSwapFlowArgs | undefined, Error, UseResumePlanParams> {
  const navigateToSwapFlow = useUniswapContextSelector((ctx) => ctx.navigateToSwapFlow)

  return useMutation({
    mutationFn: async ({
      planId,
      inputCurrencyAmount,
      earnAction,
      isEarnActivityDisplayEnabled = true,
    }: UseResumePlanParams): Promise<NavigateToSwapFlowArgs | undefined> => {
      if (earnAction !== undefined && !isEarnActivityDisplayEnabled) {
        throw new Error('Earn plan resume is disabled')
      }

      // Fetch fresh plan details
      const planResponse = await TradingApiSessionClient.refreshExistingPlan({ planId })

      if (earnAction !== undefined && planResponse.earnIntent === undefined) {
        throw new Error('Earn plan refresh response is missing earnIntent')
      }

      // Transform and store
      const transformed = transformPlanResponse(planResponse)
      const assetDetails = extractPlanResponseAssetDetails(planResponse.steps)

      activePlanStore.setState({
        resumePlanSwapFormState: createSwapFormStateFromPlanResponse(planResponse, inputCurrencyAmount),
      })
      activePlanStore.getState().actions.clearPriceChangeInterrupted(planId)
      // Keep activePlan writes centralized so resumed plans preserve derived metadata like Earn reuse identity.
      updateGlobalPlanState({
        activePlan: transformed,
        originalResponse: planResponse,
        earnReuseIdentity: getEarnPlanReuseIdentityFromPlanResponse(planResponse),
      })

      if (assetDetails) {
        return {
          inputCurrencyId: assetDetails.inputCurrencyId,
          outputCurrencyId: assetDetails.outputCurrencyId,
          exactAmountToken: inputCurrencyAmount,
          exactCurrencyField: CurrencyField.INPUT,
        }
      }

      return undefined
    },
    onError: (error, { planId }) => {
      logger.error(error, {
        tags: {
          file: 'useResumePlanMutation.ts',
          function: 'useResumePlanMutation',
        },
        extra: { planId },
      })
    },
    onSuccess: (navigationParams) => {
      successCallback?.()
      navigateToSwapFlow?.(navigationParams ?? {})
    },
  })
}

function createSwapFormStateFromPlanResponse(
  planResponse: TradingApi.PlanResponse,
  exactAmountToken: string,
): Partial<SwapFormState> | undefined {
  const extractedAssetDetails = extractPlanResponseAssetDetails(planResponse.steps)
  if (!extractedAssetDetails) {
    return undefined
  }
  const { tokenInChainId, tokenOutChainId, inputCurrencyId, outputCurrencyId } = extractedAssetDetails

  return {
    input: {
      type: AssetType.Currency,
      chainId: tokenInChainId,
      address: currencyIdToAddress(inputCurrencyId),
    },
    output: {
      type: AssetType.Currency,
      chainId: tokenOutChainId,
      address: currencyIdToAddress(outputCurrencyId),
    },
    exactCurrencyField: CurrencyField.INPUT,
    exactAmountToken,
    exactAmountFiat: undefined,
    showPendingUI: false,
    isConfirmed: false,
    txHash: undefined,
    txHashReceivedTime: undefined,
    isSubmitting: false,
    focusOnCurrencyField: undefined,
    isFiatMode: false,
  }
}
