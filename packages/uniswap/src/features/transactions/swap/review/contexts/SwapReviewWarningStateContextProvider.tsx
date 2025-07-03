import { ReactNode, useState } from 'react'
import { SwapReviewWarningStateContext } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewWarningStateContext'

export const SwapReviewWarningStateContextProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [warningAcknowledged, setWarningAcknowledged] = useState(false)
  const [shouldSubmitTx, setShouldSubmitTx] = useState(false)
  const [tokenWarningChecked, setTokenWarningChecked] = useState(false)

  const swapWarningState = {
    showWarningModal,
    warningAcknowledged,
    shouldSubmitTx,
    tokenWarningChecked,
    setShowWarningModal,
    setWarningAcknowledged,
    setShouldSubmitTx,
    setTokenWarningChecked,
  }
  return (
    <SwapReviewWarningStateContext.Provider value={swapWarningState}>{children}</SwapReviewWarningStateContext.Provider>
  )
}
