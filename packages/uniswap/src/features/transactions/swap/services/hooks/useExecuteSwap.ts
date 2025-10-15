import { useCallback } from 'react'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import type { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import type { GetExecuteSwapService } from 'uniswap/src/features/transactions/swap/services/executeSwapService'
import { createExecuteSwapService } from 'uniswap/src/features/transactions/swap/services/executeSwapService'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { SetCurrentStepFn, SwapCallback } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import type { SwapHandlers } from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { WrapCallback } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { useEvent } from 'utilities/src/react/hooks'

interface UseSwapServiceParams {
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
  swapHandlers?: SwapHandlers
  derivedSwapInfo: DerivedSwapInfo
}

export function useCreateGetExecuteSwapService(ctx: UseSwapServiceParams): GetExecuteSwapService {
  const { swapCallback, wrapCallback, swapHandlers, derivedSwapInfo } = ctx

  const account = useWallet().evmAccount
  const customSlippageTolerance = useTransactionSettingsStore((s) => s.customSlippageTolerance)
  const { isFiatMode, presetPercentage, preselectAsset } = useSwapFormStore((s) => ({
    isFiatMode: s.isFiatMode,
    presetPercentage: s.presetPercentage,
    preselectAsset: s.preselectAsset,
  }))

  // deps for our service
  // useEvent is used to create a stable fn references, but each time
  // these fns are called, they will return the latest values
  const getAccount = useEvent(() => account)
  const getIsFiatMode = useEvent(() => isFiatMode)
  const getDerivedSwapInfo = useEvent(() => derivedSwapInfo)
  const getTxSettings = useEvent(() => ({ customSlippageTolerance }))
  const getPresetInfo = useEvent(() => ({ presetPercentage, preselectAsset }))

  // factory function to create a swap service with minimal dependencies at call site
  // what changes between swap service implementations is only the onSuccess and onFailure
  return useCallback(
    (input: {
      onSuccess: () => void
      onFailure: (error?: Error) => void
      onPending: () => void
      setCurrentStep: SetCurrentStepFn
      setSteps: (steps: TransactionStep[]) => void
      // TODO: remove this once we have a better way to get the swap tx context
      getSwapTxContext: () => SwapTxAndGasInfo
    }) => {
      return createExecuteSwapService({
        getAccount,
        getSwapTxContext: input.getSwapTxContext,
        getDerivedSwapInfo,
        getTxSettings,
        getIsFiatMode,
        getPresetInfo,
        onSuccess: input.onSuccess,
        onFailure: input.onFailure,
        onPending: input.onPending,
        setCurrentStep: input.setCurrentStep,
        setSteps: input.setSteps,
        swapCallback,
        wrapCallback,
        onPrepareSwap: swapHandlers?.prepareAndSign,
        onExecuteSwap: swapHandlers?.execute,
      })
    },
    [
      swapCallback,
      wrapCallback,
      swapHandlers,
      getAccount,
      getDerivedSwapInfo,
      getPresetInfo,
      getIsFiatMode,
      getTxSettings,
    ],
  )
}
