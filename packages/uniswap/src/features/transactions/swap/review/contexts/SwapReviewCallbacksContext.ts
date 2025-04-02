import { createContext, useContext } from 'react'

export interface SwapReviewCallbacks {
  onSwapButtonClick: () => Promise<void>
  onConfirmWarning: () => void
  onCancelWarning: () => void
  onShowWarning: () => void
  onCloseWarning: () => void
  onAcceptTrade: () => void
}

export const SwapReviewCallbacksContext = createContext<SwapReviewCallbacks>(null as unknown as SwapReviewCallbacks)

export const useSwapReviewCallbacks = (): SwapReviewCallbacks => {
  const context = useContext(SwapReviewCallbacksContext)
  if (!context) {
    throw new Error('useSwapReviewCallbacks must be used within a SwapReviewCallbacksContext')
  }
  return context
}
