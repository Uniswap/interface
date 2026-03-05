import { useCallback } from 'react'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import type { GetExecuteSwapService } from 'uniswap/src/features/transactions/swap/services/executeSwapService'
import { createExecuteSwapService } from 'uniswap/src/features/transactions/swap/services/executeSwapService'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { SwapExecutionCallbacks } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import type { SwapHandlers } from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { useEvent } from 'utilities/src/react/hooks'

interface UseSwapServiceParams {
  swapHandlers: SwapHandlers
  derivedSwapInfo: DerivedSwapInfo
}

export function useCreateGetExecuteSwapService(ctx: UseSwapServiceParams): GetExecuteSwapService {
  const { swapHandlers, derivedSwapInfo } = ctx

  const address = useActiveAddress(derivedSwapInfo.chainId)
  const customSlippageTolerance = useTransactionSettingsStore((s) => s.customSlippageTolerance)
  const { isFiatMode, presetPercentage, preselectAsset } = useSwapFormStore((s) => ({
    isFiatMode: s.isFiatMode,
    presetPercentage: s.presetPercentage,
    preselectAsset: s.preselectAsset,
  }))

  // deps for our service
  // useEvent is used to create a stable fn references, but each time
  // these fns are called, they will return the latest values
  const getAddress = useEvent(() => address)
  const getIsFiatMode = useEvent(() => isFiatMode)
  const getDerivedSwapInfo = useEvent(() => derivedSwapInfo)
  const getTxSettings = useEvent(() => ({ customSlippageTolerance }))
  const getPresetInfo = useEvent(() => ({ presetPercentage, preselectAsset }))

  // factory function to create a swap service with minimal dependencies at call site
  // what changes between swap service implementations is only the onSuccess and onFailure
  return useCallback(
    (
      input: {
        // TODO: remove this once we have a better way to get the swap tx context
        getSwapTxContext: () => SwapTxAndGasInfo
      } & SwapExecutionCallbacks,
    ) => {
      return createExecuteSwapService({
        getAddress,
        getSwapTxContext: input.getSwapTxContext,
        getDerivedSwapInfo,
        getTxSettings,
        getIsFiatMode,
        getPresetInfo,
        onSuccess: input.onSuccess,
        onFailure: input.onFailure,
        onPending: input.onPending,
        onClearForm: input.onClearForm,
        setCurrentStep: input.setCurrentStep,
        setSteps: input.setSteps,
        onPrepareSwap: swapHandlers.prepareAndSign,
        onExecuteSwap: swapHandlers.execute,
      })
    },
    [swapHandlers, getAddress, getDerivedSwapInfo, getPresetInfo, getIsFiatMode, getTxSettings],
  )
}
