import { createContext, useContext } from 'react'

interface SwapFormWarningState {
  isTokenWarningModalVisible: boolean
  isBridgingWarningModalVisible: boolean
  isMaxNativeTransferModalVisible: boolean
  isViewOnlyModalVisible: boolean
  handleShowTokenWarningModal: () => void
  handleHideTokenWarningModal: () => void
  handleShowBridgingWarningModal: () => void
  handleHideBridgingWarningModal: () => void
  handleShowMaxNativeTransferModal: () => void
  handleHideMaxNativeTransferModal: () => void
  handleShowViewOnlyModal: () => void
  handleHideViewOnlyModal: () => void
}

export const SwapFormWarningStateContext = createContext<SwapFormWarningState>(null as unknown as SwapFormWarningState)

export const useSwapFormWarningState = (): SwapFormWarningState => {
  const swapFormWarningState = useContext(SwapFormWarningStateContext)
  if (!swapFormWarningState) {
    throw new Error('useSwapFormWarningState must be used within a SwapFormWarningStateProvider')
  }
  return swapFormWarningState
}
