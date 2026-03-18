import { isDevEnv } from 'utilities/src/environment/env'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type SwapReviewWarningState = {
  showWarningModal: boolean
  warningAcknowledged: boolean
  shouldSubmitTx: boolean
  tokenWarningChecked: boolean
  actions: {
    setShowWarningModal: (showWarningModal: boolean) => void
    setWarningAcknowledged: (warningAcknowledged: boolean) => void
    setShouldSubmitTx: (shouldSubmitTx: boolean) => void
    setTokenWarningChecked: (tokenWarningChecked: boolean) => void
  }
}

export type SwapReviewWarningStore = UseBoundStore<StoreApi<SwapReviewWarningState>>

export const createSwapReviewWarningStore = (): SwapReviewWarningStore =>
  create<SwapReviewWarningState>()(
    devtools(
      (set) => ({
        showWarningModal: false,
        warningAcknowledged: false,
        shouldSubmitTx: false,
        tokenWarningChecked: false,
        actions: {
          setShowWarningModal: (showWarningModal): void => set({ showWarningModal }),
          setWarningAcknowledged: (warningAcknowledged): void => set({ warningAcknowledged }),
          setShouldSubmitTx: (shouldSubmitTx): void => set({ shouldSubmitTx }),
          setTokenWarningChecked: (tokenWarningChecked): void => set({ tokenWarningChecked }),
        },
      }),
      {
        name: 'useSwapReviewWarningStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )
