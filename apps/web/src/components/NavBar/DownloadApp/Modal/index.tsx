import { InterfaceModalName } from '@uniswap/analytics-events'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ChooseUnitagModal } from 'components/NavBar/DownloadApp/Modal/ChooseUnitag'
import { GetStarted } from 'components/NavBar/DownloadApp/Modal/GetStarted'
import { DownloadAppsModal } from 'components/NavBar/DownloadApp/Modal/GetTheApp'
import { PasskeyGenerationModal } from 'components/NavBar/DownloadApp/Modal/PasskeyGeneration'
import { atom, useAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { AnimateTransition, Flex } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export enum Page {
  GetStarted = 0,
  GetApp = 1,
  ChooseUnitag = 2,
  PasskeyGeneration = 3,
}

export const downloadAppModalPageAtom = atom<Page>(Page.GetApp)

export function GetTheAppModal() {
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const initialPage = isEmbeddedWalletEnabled ? Page.GetStarted : Page.GetApp

  const [page, setPage] = useAtom(downloadAppModalPageAtom)
  const isOpen = useModalIsOpen(ModalName.GetTheApp)
  const closeModal = useCloseModal()
  const close = useCallback(() => {
    closeModal()
    setTimeout(() => setPage(initialPage), 500)
  }, [closeModal, setPage, initialPage])
  const accountDrawer = useAccountDrawer()

  const [unitag, setUnitag] = useState('')
  useEffect(() => {
    setPage(initialPage)
  }, [initialPage, setPage])

  return (
    <Trace modal={InterfaceModalName.GETTING_STARTED_MODAL}>
      <Modal name={ModalName.DownloadApp} isModalOpen={isOpen} maxWidth="fit-content" onClose={closeModal} padding={0}>
        <Flex data-testid="download-uniswap-modal" position="relative" userSelect="none">
          {/* The Page enum value corresponds to the modal page's index */}
          <AnimateTransition currentIndex={page} animationType={page === Page.GetStarted ? 'forward' : 'backward'}>
            <GetStarted
              onClose={close}
              setPage={setPage}
              toConnectWalletDrawer={() => {
                close()
                accountDrawer.open()
              }}
            />
            <DownloadAppsModal goBack={() => setPage(Page.GetStarted)} onClose={close} />
            <ChooseUnitagModal
              setUnitag={setUnitag}
              goBack={() => setPage(Page.GetStarted)}
              onClose={close}
              setPage={setPage}
            />
            <PasskeyGenerationModal
              unitag={unitag}
              goBack={() => setPage(Page.ChooseUnitag)}
              onClose={close}
              setPage={setPage}
            />
          </AnimateTransition>
        </Flex>
      </Modal>
    </Trace>
  )
}
