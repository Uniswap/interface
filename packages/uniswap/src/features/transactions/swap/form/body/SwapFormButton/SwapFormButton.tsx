import { Button, Flex, useIsShortMobileDevice } from 'ui/src'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { ViewOnlyModal } from 'uniswap/src/features/transactions/modals/ViewOnlyModal'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SwapFormButtonTrace } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/SwapFormButtonTrace'
import { useBridgingModalActions } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useBridgingModalActions'
import { useCurrenciesWithProtectionWarnings } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useCurrenciesWithProtectionWarnings'
import { useInterfaceWrap } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useInterfaceWrap'
import { useIsSwapButtonDisabled } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useIsSwapButtonDisabled'
import { useIsTradeIndicative } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useIsTradeIndicative'
import { useOnReviewPress } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useOnReviewPress'
import { useSwapFormButtonColors } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useSwapFormButtonColors'
import { useSwapFormButtonText } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useSwapFormButtonText'
import { BridgingModal } from 'uniswap/src/features/transactions/swap/modals/BridgingModal'
import { LowNativeBalanceModal } from 'uniswap/src/features/transactions/swap/modals/LowNativeBalanceModal'
import { WrapCallback } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export const SWAP_BUTTON_TEXT_VARIANT = 'buttonLabel1'

export function SwapFormButton({
  wrapCallback,
  tokenColor,
}: {
  wrapCallback?: WrapCallback
  tokenColor?: string
}): JSX.Element {
  const isShortMobileDevice = useIsShortMobileDevice()

  const { derivedSwapInfo } = useSwapFormContext()

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

  const indicative = useIsTradeIndicative()

  const { isInterfaceWrap, onInterfaceWrap } = useInterfaceWrap(wrapCallback)

  /**
   * TODO(WALL-5600): refactor this so all previous warnings are skipped
   *
   * Order of modals:
   * 1. Token protection warning
   * 2. Bridging warning
   * 3. Low native balance warning
   *
   * When skipping, ensure the previous modals are skipped as well to prevent an infinite loop
   * (eg if you skip bridging warning, you should also skip token protection warning)
   */
  const {
    onReviewPress,
    handleOnReviewPress,
    handleOnAcknowledgeTokenWarningPress,
    handleOnAcknowledgeLowNativeBalancePress,
  } = useOnReviewPress({
    handleShowViewOnlyModal,
    handleShowTokenWarningModal,
    handleShowBridgingWarningModal,
    handleShowMaxNativeTransferModal,
    onInterfaceWrap,
    isInterfaceWrap,
    handleHideMaxNativeTransferModal,
    handleHideTokenWarningModal,
  })

  const { handleBridgingOnContinue, handleBridgingOnClose } = useBridgingModalActions({
    handleHideBridgingWarningModal,
    onReviewPress,
  })

  const disabled = useIsSwapButtonDisabled()

  const buttonText = useSwapFormButtonText(isInterfaceWrap)

  const {
    backgroundColor: buttonBackgroundColor,
    variant: buttonVariant,
    emphasis: buttonEmphasis,
    buttonTextColor,
  } = useSwapFormButtonColors(tokenColor)

  const { currencyInfo0, currencyInfo1 } = useCurrenciesWithProtectionWarnings()

  return (
    <Flex alignItems="center" gap={isShortMobileDevice ? '$spacing8' : '$spacing16'}>
      <SwapFormButtonTrace>
        <LowNativeBalanceModal
          isOpen={isMaxNativeTransferModalVisible}
          onClose={handleHideMaxNativeTransferModal}
          onAcknowledge={handleOnAcknowledgeLowNativeBalancePress}
        />
        <Flex row alignSelf="stretch">
          <Button
            variant={buttonVariant}
            emphasis={buttonEmphasis}
            loading={!!indicative}
            isDisabled={disabled}
            backgroundColor={buttonBackgroundColor}
            size={isShortMobileDevice ? 'small' : 'large'}
            testID={TestID.ReviewSwap}
            onPress={handleOnReviewPress}
          >
            {buttonTextColor ? <Button.Text color={buttonTextColor}>{buttonText}</Button.Text> : buttonText}
          </Button>
        </Flex>
      </SwapFormButtonTrace>
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
    </Flex>
  )
}
