import { isDevEnv } from 'utilities/src/environment/env'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type SwapReviewCallbacksStoreState = {
  onSwapButtonClick: () => Promise<void>
  onConfirmWarning: () => void
  onCancelWarning: () => void
  onShowWarning: () => void
  onCloseWarning: () => void
  onAcceptTrade: () => void
}

export const createSwapReviewCallbacksStore = (
  initialState: SwapReviewCallbacksStoreState,
): UseBoundStore<StoreApi<SwapReviewCallbacksStoreState>> =>
  create<SwapReviewCallbacksStoreState>()(
    devtools(() => initialState, {
      name: 'useSwapReviewCallbacksStore',
      enabled: isDevEnv(),
      trace: true,
      traceLimit: 25,
    }),
  )

export type UseSwapReviewCallbacksStore = ReturnType<typeof createSwapReviewCallbacksStore>
