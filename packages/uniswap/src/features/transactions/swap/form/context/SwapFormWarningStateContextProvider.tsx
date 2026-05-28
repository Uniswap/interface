import { SwapFormWarningStateContext } from 'uniswap/src/features/transactions/swap/form/context/SwapFormWarningStateContext'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export const SwapFormWarningStateProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const {
    value: isTokenWarningModalVisible,
    setTrue: handleShowTokenWarningModal,
    setFalse: handleHideTokenWarningModal,
  } = useBooleanState(false)

  const {
    value: isBridgingWarningModalVisible,
    setTrue: handleShowBridgingWarningModal,
    setFalse: handleHideBridgingWarningModal,
  } = useBooleanState(false)

  const {
    value: isMaxNativeTransferModalVisible,
    setTrue: handleShowMaxNativeTransferModal,
    setFalse: handleHideMaxNativeTransferModal,
  } = useBooleanState(false)

  const {
    value: isViewOnlyModalVisible,
    setTrue: handleShowViewOnlyModal,
    setFalse: handleHideViewOnlyModal,
  } = useBooleanState(false)

  return (
    <SwapFormWarningStateContext.Provider
      value={{
        isTokenWarningModalVisible,
        isBridgingWarningModalVisible,
        isMaxNativeTransferModalVisible,
        isViewOnlyModalVisible,
        // actions
        handleShowTokenWarningModal,
        handleHideTokenWarningModal,
        handleShowBridgingWarningModal,
        handleHideBridgingWarningModal,
        handleShowMaxNativeTransferModal,
        handleHideMaxNativeTransferModal,
        handleShowViewOnlyModal,
        handleHideViewOnlyModal,
      }}
    >
      {children}
    </SwapFormWarningStateContext.Provider>
  )
}
