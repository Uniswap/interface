import { BridgedAssetModal } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import { LowNativeBalanceModal } from 'uniswap/src/features/transactions/modals/LowNativeBalanceModal'
import { ViewOnlyModal } from 'uniswap/src/features/transactions/modals/ViewOnlyModal'
import { useBridgingModalActions } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useBridgingModalActions'
import { useCurrenciesWithBridgingWarnings } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useCurrenciesWithBridgingWarnings'
import { useCurrenciesWithProtectionWarnings } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useCurrenciesWithProtectionWarnings'
import { useOnReviewPress } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useOnReviewPress'
import { BridgingModal } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormWarningModals/BridgingModal'
import {
  useSwapFormWarningStore,
  useSwapFormWarningStoreActions,
} from 'uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/useSwapFormWarningStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

const LocalLowNativeBalanceModal = (): JSX.Element => {
  const isMaxNativeTransferModalVisible = useSwapFormWarningStore((s) => s.isMaxNativeTransferModalVisible)

  const { handleHideMaxNativeTransferModal } = useSwapFormWarningStoreActions()

  const { handleOnAcknowledgeLowNativeBalancePress } = useOnReviewPress()

  return (
    <LowNativeBalanceModal
      isOpen={isMaxNativeTransferModalVisible}
      onClose={handleHideMaxNativeTransferModal}
      onAcknowledge={handleOnAcknowledgeLowNativeBalancePress}
    />
  )
}

const LocalViewOnlyModal = (): JSX.Element => {
  const isViewOnlyModalVisible = useSwapFormWarningStore((s) => s.isViewOnlyModalVisible)
  const { handleHideViewOnlyModal } = useSwapFormWarningStoreActions()

  return <ViewOnlyModal isOpen={isViewOnlyModalVisible} onDismiss={handleHideViewOnlyModal} />
}

const LocalBridgingModal = (): JSX.Element => {
  const isBridgingWarningModalVisible = useSwapFormWarningStore((s) => s.isBridgingWarningModalVisible)
  const { handleHideBridgingWarningModal } = useSwapFormWarningStoreActions()

  const derivedSwapInfo = useSwapFormStore((s) => s.derivedSwapInfo)

  const { onReviewPress } = useOnReviewPress()

  const { handleBridgingOnContinue, handleBridgingOnClose } = useBridgingModalActions({
    handleHideBridgingWarningModal,
    onReviewPress,
  })

  return (
    <BridgingModal
      isOpen={isBridgingWarningModalVisible}
      derivedSwapInfo={derivedSwapInfo}
      onContinue={handleBridgingOnContinue}
      onClose={handleBridgingOnClose}
    />
  )
}

const LocalTokenWarningModal = (): JSX.Element | null => {
  const isTokenWarningModalVisible = useSwapFormWarningStore((s) => s.isTokenWarningModalVisible)
  const { handleHideTokenWarningModal } = useSwapFormWarningStoreActions()

  const { currencyInfo0, currencyInfo1 } = useCurrenciesWithProtectionWarnings()

  const { handleOnAcknowledgeTokenWarningPress } = useOnReviewPress()

  if (!currencyInfo0) {
    return null
  }

  return (
    <TokenWarningModal
      isVisible={isTokenWarningModalVisible}
      currencyInfo0={currencyInfo0}
      currencyInfo1={currencyInfo1}
      closeModalOnly={handleHideTokenWarningModal}
      onAcknowledge={handleOnAcknowledgeTokenWarningPress}
    />
  )
}

const LocalBridgedAssetModal = (): JSX.Element => {
  const isBridgedAssetModalVisible = useSwapFormWarningStore((s) => s.isBridgedAssetModalVisible)
  const { handleHideBridgedAssetModal } = useSwapFormWarningStoreActions()

  const { currencyInfo0, currencyInfo1 } = useCurrenciesWithBridgingWarnings()
  const { handleOnAcknowledgeBridgedAssetPress } = useOnReviewPress()

  return (
    <BridgedAssetModal
      currencyInfo0={currencyInfo0}
      currencyInfo1={currencyInfo1}
      isOpen={isBridgedAssetModalVisible}
      onClose={handleHideBridgedAssetModal}
      onContinue={handleOnAcknowledgeBridgedAssetPress}
    />
  )
}

export const SwapFormWarningModals = (): JSX.Element => {
  return (
    <>
      <LocalLowNativeBalanceModal />
      <LocalViewOnlyModal />
      <LocalBridgingModal />
      <LocalTokenWarningModal />
      <LocalBridgedAssetModal />
    </>
  )
}
