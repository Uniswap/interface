import { PlanResponse } from '@universe/api/src/clients/trading/__generated__/models/PlanResponse'
import { AssetType } from 'uniswap/src/entities/assets'
import { extractPlanResponseAssetDetails } from 'uniswap/src/features/activity/extract/extractPlanResponseDetails'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'

export function usePopulateSwapFlowWithPlan(): (planResponse: PlanResponse) => void {
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)

  return useEvent((planResponse: PlanResponse): void => {
    const extractedAssetDetails = extractPlanResponseAssetDetails(planResponse.steps)
    if (!extractedAssetDetails) {
      return
    }
    const { tokenInChainId, tokenOutChainId, inputCurrencyId, outputCurrencyId, inputCurrencyAmountRaw } =
      extractedAssetDetails

    updateSwapForm({
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
      exactAmountToken: inputCurrencyAmountRaw,
      exactAmountFiat: undefined,
      showPendingUI: false,
      isConfirmed: false,
      instantReceiptFetchTime: undefined,
      instantOutputAmountRaw: undefined,
      txHash: undefined,
      txHashReceivedTime: undefined,
      isSubmitting: false,
      focusOnCurrencyField: undefined,
      isFiatMode: false,
    })
  })
}
