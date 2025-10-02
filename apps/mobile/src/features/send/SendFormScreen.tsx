import { useFocusEffect } from '@react-navigation/core'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableWithoutFeedback } from 'react-native'
import Animated from 'react-native-reanimated'
import { RecipientSelect } from 'src/components/RecipientSelect/RecipientSelect'
import { SEND_CONTENT_RENDER_DELAY_MS } from 'src/features/send/constants'
import { SendFormButton } from 'src/features/send/SendFormButton'
import { SendHeader } from 'src/features/send/SendHeader'
import { SendTokenForm } from 'src/features/send/SendTokenForm'
import { Flex, useSporeColors } from 'ui/src'
import { Eye } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { TokenSelectorModal, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  TransactionModalFooterContainer,
  TransactionModalInnerContainer,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { CompatibleAddressModal } from 'uniswap/src/features/transactions/modals/CompatibleAddressModal'
import { LowNativeBalanceModal } from 'uniswap/src/features/transactions/modals/LowNativeBalanceModal'
import { CurrencyField } from 'uniswap/src/types/currency'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

function useGoToReviewScreen(): () => void {
  const { updateSendForm } = useSendContext()
  const { setScreen } = useTransactionModalContext()
  return useCallback(() => {
    const txId = createTransactionId()
    updateSendForm({ txId })
    setScreen(TransactionScreen.Review)
  }, [setScreen, updateSendForm])
}

export function SendFormScreen(): JSX.Element {
  const [hideContent, setHideContent] = useState(true)
  useEffect(() => {
    setTimeout(() => setHideContent(false), SEND_CONTENT_RENDER_DELAY_MS)
  }, [])

  return <SendFormScreenContent hideContent={hideContent} />
}

function SendFormScreenContent({ hideContent }: { hideContent: boolean }): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { bottomSheetViewStyles } = useTransactionModalContext()
  const { showRecipientSelector, recipient, derivedSendInfo, updateSendForm } = useSendContext()
  const [showViewOnlyModal, setShowViewOnlyModal] = useState(false)
  const [showMaxTransferModal, setShowMaxTransferModal] = useState(false)
  const [showCompatibleAddressModal, setShowCompatibleAddressModal] = useState(false)

  const onSelectRecipient = useCallback(
    (newRecipient: string) => {
      updateSendForm({ recipient: newRecipient, showRecipientSelector: false })
    },
    [updateSendForm],
  )

  const onHideRecipientSelector = useCallback(() => {
    updateSendForm({ showRecipientSelector: false })
  }, [updateSendForm])

  const hideLowNetworkTokenWarning = useCallback(() => {
    setShowMaxTransferModal(false)
  }, [])

  const hideViewOnlyModal = useCallback(() => {
    setShowViewOnlyModal(false)
  }, [])

  const hideCompatibleAddressModal = useCallback(() => {
    setShowCompatibleAddressModal(false)
  }, [])

  const goToReviewScreen = useGoToReviewScreen()

  // Renders recipient select within a bottom sheet, only used when a recipient already exists. If no recipient
  // a full screen select view is rendered within `SendFlow`
  const showRecipientSelectBottomSheet = recipient && showRecipientSelector

  return (
    <>
      <TransactionModalInnerContainer fullscreen bottomSheetViewStyles={[bottomSheetViewStyles]}>
        {showRecipientSelectBottomSheet && (
          <Modal
            extendOnKeyboardVisible
            fullScreen
            backgroundColor={colors.surface1.val}
            name={ModalName.TokenSelector}
            snapPoints={['65%', '100%']}
            onClose={onHideRecipientSelector}
          >
            <Flex fill px="$spacing16">
              <RecipientSelect
                chainId={derivedSendInfo.chainId as UniverseChainId}
                hideBackButton={true}
                recipient={recipient}
                renderedInModal={true}
                onHideRecipientSelector={onHideRecipientSelector}
                onSelectRecipient={onSelectRecipient}
              />
            </Flex>
          </Modal>
        )}

        {!hideContent && (
          <>
            <SendHeader flowName={t('send.title')} setShowViewOnlyModal={setShowViewOnlyModal} />
            <SendFormContent
              showLowNetworkTokenWarning={showMaxTransferModal}
              showViewOnlyModal={showViewOnlyModal}
              showCompatibleAddressModal={showCompatibleAddressModal}
              hideLowNetworkTokenWarning={hideLowNetworkTokenWarning}
              hideViewOnlyModal={hideViewOnlyModal}
              hideCompatibleAddressModal={hideCompatibleAddressModal}
            />
          </>
        )}
      </TransactionModalInnerContainer>
      <TransactionModalFooterContainer>
        <SendFormButton
          goToReviewScreen={goToReviewScreen}
          setShowViewOnlyModal={setShowViewOnlyModal}
          setShowMaxTransferModal={setShowMaxTransferModal}
          setShowCompatibleAddressModal={setShowCompatibleAddressModal}
        />
      </TransactionModalFooterContainer>
    </>
  )
}

function SendFormContent({
  showViewOnlyModal,
  hideViewOnlyModal,
  showLowNetworkTokenWarning,
  hideLowNetworkTokenWarning,
  showCompatibleAddressModal,
  hideCompatibleAddressModal,
}: {
  showViewOnlyModal: boolean
  hideViewOnlyModal: () => void
  showLowNetworkTokenWarning: boolean
  hideLowNetworkTokenWarning: () => void
  showCompatibleAddressModal: boolean
  hideCompatibleAddressModal: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const {
    derivedSendInfo: { currencyInInfo },
  } = useSendContext()

  const goToReviewScreen = useGoToReviewScreen()

  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const { selectingCurrencyField, onSelectCurrency, updateSendForm } = useSendContext()

  const onHideTokenSelector = useCallback(() => {
    updateSendForm({ selectingCurrencyField: undefined })
  }, [updateSendForm])

  const onCloseLowNativeBalanceWarning = useCallback(() => {
    hideViewOnlyModal()
    hideLowNetworkTokenWarning()
  }, [hideViewOnlyModal, hideLowNetworkTokenWarning])

  const onAcknowledgeLowNativeBalanceWarning = useCallback(() => {
    hideLowNetworkTokenWarning()
    goToReviewScreen()
  }, [hideLowNetworkTokenWarning, goToReviewScreen])

  const onCloseCompatibleAddressWarning = useCallback(() => {
    hideCompatibleAddressModal()
  }, [hideCompatibleAddressModal])

  const onAcknowledgeCompatibleAddressWarning = useCallback(() => {
    hideCompatibleAddressModal()
    goToReviewScreen()
  }, [hideCompatibleAddressModal, goToReviewScreen])

  return (
    <>
      <WarningModal
        caption={t('send.warning.viewOnly.message')}
        acknowledgeText={t('common.button.dismiss')}
        icon={<Eye color="$neutral1" size="$icon.24" />}
        isOpen={showViewOnlyModal}
        modalName={ModalName.SwapWarning}
        severity={WarningSeverity.Low}
        title={t('send.warning.viewOnly.title')}
        onClose={hideViewOnlyModal}
        onAcknowledge={hideViewOnlyModal}
      />

      <LowNativeBalanceModal
        isOpen={showLowNetworkTokenWarning}
        onClose={onCloseLowNativeBalanceWarning}
        onAcknowledge={onAcknowledgeLowNativeBalanceWarning}
      />

      {currencyInInfo && (
        <CompatibleAddressModal
          currencyInfo={currencyInInfo}
          isOpen={showCompatibleAddressModal}
          onClose={onCloseCompatibleAddressWarning}
          onAcknowledge={onAcknowledgeCompatibleAddressWarning}
        />
      )}

      <TouchableWithoutFeedback>
        <Flex fill>
          <Animated.View style={{ position: 'absolute', height: '100%', width: '100%' }}>
            <SendTokenForm />
          </Animated.View>
        </Flex>
      </TouchableWithoutFeedback>
      {!!selectingCurrencyField && (
        <TokenSelectorModal
          isModalOpen
          evmAddress={activeAccountAddress}
          currencyField={CurrencyField.INPUT}
          flow={TokenSelectorFlow.Send}
          variation={TokenSelectorVariation.BalancesOnly}
          focusHook={useFocusEffect}
          onClose={onHideTokenSelector}
          onSelectCurrency={onSelectCurrency}
        />
      )}
    </>
  )
}
