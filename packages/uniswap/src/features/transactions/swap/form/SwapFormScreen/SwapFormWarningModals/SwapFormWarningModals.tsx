import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { LowNativeBalanceModal } from 'uniswap/src/features/transactions/modals/LowNativeBalanceModal'
import { ViewOnlyModal } from 'uniswap/src/features/transactions/modals/ViewOnlyModal'
import { useBridgingModalActions } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useBridgingModalActions'
import { useCurrenciesWithProtectionWarnings } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useCurrenciesWithProtectionWarnings'
import { useOnReviewPress } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useOnReviewPress'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { BridgingModal } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormWarningModals/BridgingModal'
import { useSwapFormWarningState } from 'uniswap/src/features/transactions/swap/form/context/SwapFormWarningStateContext'

export const SwapFormWarningModals = (): JSX.Element => {
  const { derivedSwapInfo } = useSwapFormContext()

  const {
    isTokenWarningModalVisible,
    isBridgingWarningModalVisible,
    isMaxNativeTransferModalVisible,
    isViewOnlyModalVisible,
    handleHideTokenWarningModal,
    handleHideBridgingWarningModal,
    handleHideMaxNativeTransferModal,
    handleHideViewOnlyModal,
  } = useSwapFormWarningState()

  const { onReviewPress, handleOnAcknowledgeTokenWarningPress, handleOnAcknowledgeLowNativeBalancePress } =
    useOnReviewPress()

  const { handleBridgingOnContinue, handleBridgingOnClose } = useBridgingModalActions({
    handleHideBridgingWarningModal,
    onReviewPress,
  })

  const { currencyInfo0, currencyInfo1 } = useCurrenciesWithProtectionWarnings()

  return (
    <>
      <LowNativeBalanceModal
        isOpen={isMaxNativeTransferModalVisible}
        onClose={handleHideMaxNativeTransferModal}
        onAcknowledge={handleOnAcknowledgeLowNativeBalancePress}
      />
      <ViewOnlyModal isOpen={isViewOnlyModalVisible} onDismiss={handleHideViewOnlyModal} />
      <BridgingModal
        isOpen={isBridgingWarningModalVisible}
        derivedSwapInfo={derivedSwapInfo}
        onContinue={handleBridgingOnContinue}
        onClose={handleBridgingOnClose}
      />
      {currencyInfo0 && (
        <TokenWarningModal
          isVisible={isTokenWarningModalVisible}
          currencyInfo0={currencyInfo0}
          currencyInfo1={currencyInfo1}
          closeModalOnly={handleHideTokenWarningModal}
          onAcknowledge={handleOnAcknowledgeTokenWarningPress}
        />
      )}
    </>
  )
}
