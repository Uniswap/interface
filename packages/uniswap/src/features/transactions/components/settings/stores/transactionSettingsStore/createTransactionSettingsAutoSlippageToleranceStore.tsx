import { isDevEnv } from 'utilities/src/environment/env'
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { StoreApi } from 'zustand/vanilla'

export interface TransactionSettingsAutoSlippageToleranceState {
  autoSlippageTolerance: number | undefined
  actions: {
    setAutoSlippageTolerance: (tolerance: number | undefined) => void
  }
}

export const createTransactionSettingsAutoSlippageToleranceStore = (
  initialAutoSlippageTolerance?: number,
): StoreApi<TransactionSettingsAutoSlippageToleranceState> => {
  const store = create<TransactionSettingsAutoSlippageToleranceState>()(
    devtools(
      subscribeWithSelector((set) => {
        return {
          autoSlippageTolerance: initialAutoSlippageTolerance,
          actions: {
            setAutoSlippageTolerance: (tolerance: number | undefined): void =>
              set({ autoSlippageTolerance: tolerance }),
          },
        }
      }),
      {
        name: 'useTransactionSettingsAutoSlippageToleranceStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )

  return store
}
