import { ModalState, miniPortfolioModalStateAtom } from 'components/AccountDrawer/constants'
import { AddressQRCode } from 'components/AddressQRCode'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { ChooseProvider } from 'components/ReceiveCryptoModal/ChooseProvider'
import { useAccount } from 'hooks/useAccount'
import { useAtom } from 'jotai'
import ms from 'ms'
import { ContentWrapper } from 'pages/Swap/Buy/shared'
import { useRef, useState } from 'react'
import { AnimateTransition } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

export function ReceiveCryptoModal() {
  const account = useAccount()
  const [modalState, setModalState] = useAtom(miniPortfolioModalStateAtom)

  const initialModalState = useRef(modalState)
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
    setModalState(initialModalState.current)
  })

  if (!account.address) {
    logger.debug('ReceiveCryptoModal', 'ReceiveCryptoModal', 'Modal opened with invalid state. Closing modal.')
    onClose()
    return null
  }

  const currentIndex = modalState === ModalState.CEX_TRANSFER || modalState === ModalState.DEFAULT ? 0 : 1

  return (
    <Modal name={ModalName.ReceiveCryptoModal} isModalOpen={modalState !== undefined} onClose={onClose} maxWidth={420}>
      <ContentWrapper>
        <GetHelpHeader
          goBack={modalState !== initialModalState.current ? goBack : undefined}
          link={uniswapUrls.helpArticleUrls.transferCryptoHelp}
          closeModal={onClose}
        />
        <AnimateTransition currentIndex={currentIndex} animationType="forward">
          <ChooseProvider
            providersOnly={modalState === ModalState.CEX_TRANSFER}
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
