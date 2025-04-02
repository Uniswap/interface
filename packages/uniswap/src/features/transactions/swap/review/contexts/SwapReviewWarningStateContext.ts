import { createContext, useContext } from 'react'

export interface SwapWarningState {
  showWarningModal: boolean
  warningAcknowledged: boolean
  shouldSubmitTx: boolean
  tokenWarningChecked: boolean
  setShowWarningModal: (showWarningModal: boolean) => void
  setWarningAcknowledged: (warningAcknowledged: boolean) => void
  setShouldSubmitTx: (shouldSubmitTx: boolean) => void
  setTokenWarningChecked: (tokenWarningChecked: boolean) => void
}

export const SwapReviewWarningStateContext = createContext<SwapWarningState>({
  showWarningModal: false,
  warningAcknowledged: false,
  shouldSubmitTx: false,
  tokenWarningChecked: false,
  setShowWarningModal: () => {},
  setWarningAcknowledged: () => {},
  setShouldSubmitTx: () => {},
  setTokenWarningChecked: () => {},
})

export const useSwapWarningState = (): SwapWarningState => {
  const context = useContext(SwapReviewWarningStateContext)
  if (!context) {
    throw new Error('useSwapWarningState must be used within a SwapReviewWarningStateContext')
  }
  return context
}
