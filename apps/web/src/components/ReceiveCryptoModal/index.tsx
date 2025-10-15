import { AddressQRCode } from 'components/AddressQRCode'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { ChooseProvider } from 'components/ReceiveCryptoModal/ChooseProvider'
import { ReceiveModalState, receiveCryptoModalStateAtom } from 'components/ReceiveCryptoModal/state'
import { useAccount } from 'hooks/useAccount'
import { useAtom } from 'jotai'
import ms from 'ms'
import { ContentWrapper } from 'pages/Swap/Buy/shared'
import { useEffect, useState } from 'react'
import { AnimateTransition } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

export function ReceiveCryptoModal() {
  const account = useAccount()
  const [modalState, setModalState] = useAtom(receiveCryptoModalStateAtom)

  const [errorProvider, setErrorProvider] = useState<FORServiceProvider>()
  const [connectedProvider, setConnectedProvider] = useState<FORServiceProvider>()

  const onClose = useEvent(() => {
    setModalState(undefined)

    // Delay the state reset until the modal finishes animating away:
    setTimeout(() => {
      setErrorProvider(undefined)
      setConnectedProvider(undefined)
    }, ms('500ms'))
  })

  const goBack = useEvent(() => {
    // If we have a connected or error provider, clear those first
    if (connectedProvider || errorProvider) {
      setConnectedProvider(undefined)
      setErrorProvider(undefined)
    } else {
      // Otherwise, navigate back to DEFAULT state (for QR_CODE -> DEFAULT)
      setModalState(ReceiveModalState.DEFAULT)
    }
  })

  // Close modal if account becomes disconnected - use useEffect to avoid infinite re-renders
  useEffect(() => {
    if (!account.address && modalState !== undefined) {
      logger.debug('ReceiveCryptoModal', 'ReceiveCryptoModal', 'Modal opened with invalid state. Closing modal.')
      onClose()
    }
  }, [account.address, modalState, onClose])

  if (!account.address) {
    return null
  }

  const currentIndex = modalState === ReceiveModalState.CEX_TRANSFER || modalState === ReceiveModalState.DEFAULT ? 0 : 1

  return (
    <Modal name={ModalName.ReceiveCryptoModal} isModalOpen={modalState !== undefined} onClose={onClose} maxWidth={420}>
      <ContentWrapper>
        <GetHelpHeader
          goBack={modalState === ReceiveModalState.QR_CODE || connectedProvider || errorProvider ? goBack : undefined}
          link={uniswapUrls.helpArticleUrls.transferCryptoHelp}
          closeModal={onClose}
        />
        <AnimateTransition currentIndex={currentIndex} animationType="forward">
          <ChooseProvider
            providersOnly={modalState === ReceiveModalState.CEX_TRANSFER}
            errorProvider={errorProvider}
            connectedProvider={connectedProvider}
            setErrorProvider={setErrorProvider}
            setConnectedProvider={setConnectedProvider}
          />
          <AddressQRCode accountAddress={account.address} />
        </AnimateTransition>
      </ContentWrapper>
    </Modal>
  )
}
