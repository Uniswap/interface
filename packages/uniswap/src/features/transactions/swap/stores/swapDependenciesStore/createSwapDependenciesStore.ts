import type { GetExecuteSwapService } from 'uniswap/src/features/transactions/swap/services/executeSwapService'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { PrepareSwapCallback } from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import { isDevEnv } from 'utilities/src/environment/env'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type SwapDependenciesState = {
  derivedSwapInfo: DerivedSwapInfo
  getExecuteSwapService: GetExecuteSwapService
  prepareSwapTransaction?: PrepareSwapCallback
  actions: {
    setDerivedSwapInfo: (derivedSwapInfo: DerivedSwapInfo) => void
    setGetExecuteSwapService: (getExecuteSwapService: GetExecuteSwapService) => void
    setPrepareSwapTransaction: (prepareSwapTransaction: PrepareSwapCallback) => void
  }
}

export type SwapDependenciesStore = UseBoundStore<StoreApi<SwapDependenciesState>>

export const createSwapDependenciesStore = ({
  derivedSwapInfo,
  getExecuteSwapService,
  prepareSwapTransaction,
}: Omit<SwapDependenciesState, 'actions'>): SwapDependenciesStore =>
  create<SwapDependenciesState>()(
    devtools(
      (set) => ({
        derivedSwapInfo,
        getExecuteSwapService,
        prepareSwapTransaction,
        actions: {
          setDerivedSwapInfo: (newDerivedSwapInfo): void => set({ derivedSwapInfo: newDerivedSwapInfo }),
          setGetExecuteSwapService: (newGetExecuteSwapService): void =>
            set({ getExecuteSwapService: newGetExecuteSwapService }),
          setPrepareSwapTransaction: (newPrepareSwapTransaction): void =>
            set({ prepareSwapTransaction: newPrepareSwapTransaction }),
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
