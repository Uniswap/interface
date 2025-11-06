import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ChooseUnitagModal } from 'components/NavBar/DownloadApp/Modal/ChooseUnitag'
import { DownloadAppsModal } from 'components/NavBar/DownloadApp/Modal/DownloadApps'
import { GetStarted } from 'components/NavBar/DownloadApp/Modal/GetStarted'
import { PasskeyGenerationModal } from 'components/NavBar/DownloadApp/Modal/PasskeyGeneration'
import { useModalState } from 'hooks/useModalState'
import { atom, useAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { AnimatedPager, Flex } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

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
  const { isOpen, closeModal } = useModalState(ModalName.GetTheApp)
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
    <Modal
      skipLogImpression
      name={ModalName.DownloadApp}
      isModalOpen={isOpen}
      maxWidth="fit-content"
      mx="auto"
      onClose={close}
      padding={0}
    >
      <Flex data-testid={TestID.DownloadUniswapModal} position="relative" userSelect="none">
        {/* The Page enum value corresponds to the modal page's index */}
        <AnimatedPager currentIndex={page}>
          <GetStarted
            onClose={close}
            setPage={setPage}
            toConnectWalletDrawer={() => {
              close()
              accountDrawer.open()
            }}
          />
          <DownloadAppsModal
            goBack={isEmbeddedWalletEnabled ? () => setPage(Page.GetStarted) : undefined}
            onClose={close}
          />
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
        </AnimatedPager>
      </Flex>
    </Modal>
  )
}
