import { ChooseProvider } from 'components/ReceiveCryptoModal/ChooseProvider'
import { useAccount } from 'hooks/useAccount'
import ms from 'ms'
import { ProviderConnectedView } from 'pages/Swap/Buy/ProviderConnectedView'
import { ProviderConnectionError } from 'pages/Swap/Buy/ProviderConnectionError'
import { ContentWrapper } from 'pages/Swap/Buy/shared'
import { useCallback, useState } from 'react'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'

export function ReceiveCryptoModal() {
  const account = useAccount()
  const toggleModal = useToggleModal(ApplicationModal.RECEIVE_CRYPTO)
  const isOpen = useModalIsOpen(ApplicationModal.RECEIVE_CRYPTO)

  const [errorProvider, setErrorProvider] = useState<FORServiceProvider>()
  const [connectedProvider, setConnectedProvider] = useState<FORServiceProvider>()

  const onClose = useCallback(() => {
    toggleModal()
    // Delay the state reset until the modal finishes animating away:
    setTimeout(() => {
      setErrorProvider(undefined)
      setConnectedProvider(undefined)
    }, ms('500ms'))
  }, [toggleModal, setErrorProvider, setConnectedProvider])

  if (!account.address) {
    logger.debug('ReceiveCryptoModal', 'ReceiveCryptoModal', 'Modal opened with invalid state. Closing modal.')
    onClose()
    return null
  }
  return (
    <Modal name={ModalName.ReceiveCryptoModal} isModalOpen={isOpen} onClose={onClose} maxWidth={420}>
      <ContentWrapper>
        {errorProvider ? (
          <ProviderConnectionError
            onBack={() => setErrorProvider(undefined)}
            closeModal={onClose}
            selectedServiceProvider={errorProvider}
          />
        ) : connectedProvider ? (
          <ProviderConnectedView closeModal={onClose} selectedServiceProvider={connectedProvider} />
        ) : (
          <ChooseProvider setErrorProvider={setErrorProvider} setConnectedProvider={setConnectedProvider} />
        )}
      </ContentWrapper>
    </Modal>
  )
}
