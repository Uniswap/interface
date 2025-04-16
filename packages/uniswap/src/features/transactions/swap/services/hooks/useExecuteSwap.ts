import { useCallback } from 'react'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import {
  GetExecuteSwapService,
  createExecuteSwapService,
} from 'uniswap/src/features/transactions/swap/services/executeSwapService'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { TransactionStep } from 'uniswap/src/features/transactions/swap/types/steps'
import { SetCurrentStepFn, SwapCallback } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { WrapCallback } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { useEvent } from 'utilities/src/react/hooks'

interface UseSwapServiceParams {
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
  derivedSwapInfo: DerivedSwapInfo
}

export function useCreateGetExecuteSwapService(ctx: UseSwapServiceParams): GetExecuteSwapService {
  const { swapCallback, wrapCallback, derivedSwapInfo } = ctx

  const account = useAccountMeta()
  const { customSlippageTolerance } = useTransactionSettingsContext()
  const { isFiatMode, presetPercentage, preselectAsset } = useSwapFormContext()

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
        setCurrentStep: input.setCurrentStep,
        setSteps: input.setSteps,
        swapCallback,
        wrapCallback,
      })
    },
    [swapCallback, wrapCallback, getAccount, getDerivedSwapInfo, getPresetInfo, getIsFiatMode, getTxSettings],
  )
}
