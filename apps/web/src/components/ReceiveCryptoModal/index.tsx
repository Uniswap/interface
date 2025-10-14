import { ChooseMultiPlatformProvider } from 'components/ReceiveCryptoModal/ChooseMultiPlatformProvider'
import { ChooseProvider } from 'components/ReceiveCryptoModal/ChooseProvider'
import { ReceiveModalState } from 'components/ReceiveCryptoModal/types'
import { useOpenReceiveCryptoModal } from 'components/ReceiveCryptoModal/useOpenReceiveCryptoModal'
import { useConnectionStatus } from 'features/accounts/store/hooks'
import { useModalInitialState } from 'hooks/useModalInitialState'
import { useModalState } from 'hooks/useModalState'
import ms from 'ms'
import { ContentWrapper } from 'pages/Swap/Buy/shared'
import { useEffect, useState } from 'react'
import { AnimateTransition } from 'ui/src'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ReceiveQRCode } from 'uniswap/src/components/ReceiveQRCode/ReceiveQRCode'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

export function ReceiveCryptoModal() {
  const modalState = useModalInitialState(ModalName.ReceiveCryptoModal)
  const { isOpen, closeModal } = useModalState(ModalName.ReceiveCryptoModal)

  const qrCodeAddress = modalState?.modalState === ReceiveModalState.QR_CODE ? modalState.qrCodeAddress : undefined
  const selectedServiceProvider =
    modalState?.modalState === ReceiveModalState.CEX_TRANSFER_CHOOSE_PLATFORM ? modalState.serviceProvider : undefined
  const currentModalState = modalState?.modalState

  const [errorProvider, setErrorProvider] = useState<FORServiceProvider>()
  const [connectedProvider, setConnectedProvider] = useState<FORServiceProvider>()

  const onClose = useEvent(() => {
    closeModal()

    // Delay the state reset until the modal finishes animating away:
    setTimeout(() => {
      setErrorProvider(undefined)
      setConnectedProvider(undefined)
    }, ms('500ms'))
  })

  const navigateToDefault = useOpenReceiveCryptoModal({
    modalState: ReceiveModalState.DEFAULT,
  })
  const goBack = useEvent(() => {
    // If we have a connected or error provider, clear those first
    if (connectedProvider || errorProvider) {
      setConnectedProvider(undefined)
      setErrorProvider(undefined)
    } else {
      // Otherwise, navigate back to DEFAULT state (for QR_CODE -> DEFAULT)
      navigateToDefault()
    }
  })

  // Close modal if account becomes disconnected - use useEffect to avoid infinite re-renders
  const isDisconnected = useConnectionStatus('aggregate').isDisconnected
  useEffect(() => {
    if (isDisconnected && isOpen) {
      logger.debug('ReceiveCryptoModal', 'ReceiveCryptoModal', 'Modal opened with invalid state. Closing modal.')
      onClose()
    }
  }, [isDisconnected, isOpen, onClose])

  if (isDisconnected) {
    return null
  }

  const currentIndex =
    currentModalState === ReceiveModalState.CEX_TRANSFER || currentModalState === ReceiveModalState.DEFAULT ? 0 : 1

  return (
    <Modal name={ModalName.ReceiveCryptoModal} isModalOpen={isOpen} onClose={onClose} maxWidth={420}>
      <ContentWrapper>
        <GetHelpHeader
          goBack={
            currentModalState === ReceiveModalState.QR_CODE ||
            currentModalState === ReceiveModalState.CEX_TRANSFER_CHOOSE_PLATFORM ||
            connectedProvider ||
            errorProvider
              ? goBack
              : undefined
          }
          link={uniswapUrls.helpArticleUrls.transferCryptoHelp}
          closeModal={onClose}
        />
        <AnimateTransition currentIndex={currentIndex} animationType="forward">
          <ChooseProvider
            providersOnly={currentModalState === ReceiveModalState.CEX_TRANSFER}
            errorProvider={errorProvider}
            connectedProvider={connectedProvider}
            setErrorProvider={setErrorProvider}
            setConnectedProvider={setConnectedProvider}
          />
          {selectedServiceProvider ? (
            <ChooseMultiPlatformProvider
              errorProvider={errorProvider}
              connectedProvider={connectedProvider}
              setErrorProvider={setErrorProvider}
              setConnectedProvider={setConnectedProvider}
              selectedServiceProvider={selectedServiceProvider}
            />
          ) : qrCodeAddress ? (
            <ReceiveQRCode address={qrCodeAddress} />
          ) : null}
        </AnimateTransition>
      </ContentWrapper>
    </Modal>
  )
}
