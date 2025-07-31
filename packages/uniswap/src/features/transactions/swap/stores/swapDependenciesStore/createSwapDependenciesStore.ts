import type { GetExecuteSwapService } from 'uniswap/src/features/transactions/swap/services/executeSwapService'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { PrepareSwapCallback } from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import type { WrapCallback } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { isDevEnv } from 'utilities/src/environment/env'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type SwapDependenciesState = {
  derivedSwapInfo: DerivedSwapInfo
  getExecuteSwapService: GetExecuteSwapService
  prepareSwapTransaction?: PrepareSwapCallback
  wrapCallback: WrapCallback
  actions: {
    setDerivedSwapInfo: (derivedSwapInfo: DerivedSwapInfo) => void
    setGetExecuteSwapService: (getExecuteSwapService: GetExecuteSwapService) => void
    setPrepareSwapTransaction: (prepareSwapTransaction: PrepareSwapCallback) => void
    setWrapCallback: (wrapCallback: WrapCallback) => void
  }
}

export type SwapDependenciesStore = UseBoundStore<StoreApi<SwapDependenciesState>>

export const createSwapDependenciesStore = ({
  derivedSwapInfo,
  getExecuteSwapService,
  prepareSwapTransaction,
  wrapCallback,
}: Omit<SwapDependenciesState, 'actions'>): SwapDependenciesStore =>
  create<SwapDependenciesState>()(
    devtools(
      (set) => ({
        derivedSwapInfo,
        getExecuteSwapService,
        prepareSwapTransaction,
        wrapCallback,
        actions: {
          setDerivedSwapInfo: (newDerivedSwapInfo): void => set({ derivedSwapInfo: newDerivedSwapInfo }),
          setGetExecuteSwapService: (newGetExecuteSwapService): void =>
            set({ getExecuteSwapService: newGetExecuteSwapService }),
          setPrepareSwapTransaction: (newPrepareSwapTransaction): void =>
            set({ prepareSwapTransaction: newPrepareSwapTransaction }),
          setWrapCallback: (newWrapCallback): void => set({ wrapCallback: newWrapCallback }),
        },
      }),
      {
        name: 'useSwapDependenciesStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )
