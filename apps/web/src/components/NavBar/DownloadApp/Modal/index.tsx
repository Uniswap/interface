import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { atom, useAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { AnimatedPager, Flex, useMedia, WebBottomSheet } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ChooseUnitagModal } from '~/components/NavBar/DownloadApp/Modal/ChooseUnitag'
import { DownloadAppsModal } from '~/components/NavBar/DownloadApp/Modal/DownloadApps'
import { KeyManagementModal } from '~/components/NavBar/DownloadApp/Modal/KeyManagement'
import { PasskeyGenerationModal } from '~/components/NavBar/DownloadApp/Modal/PasskeyGeneration'
import { useIOSBodyScrollLock } from '~/hooks/useIOSBodyScrollLock'
import { useModalState } from '~/hooks/useModalState'

export enum Page {
  DownloadApp = 0,
  ChooseUnitag = 1,
  KeyManagement = 2,
  PasskeyGeneration = 3,
}

export const downloadAppModalPageAtom = atom<Page>(Page.DownloadApp)

export function GetTheAppModal() {
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const initialPage = isEmbeddedWalletEnabled ? Page.ChooseUnitag : Page.DownloadApp

  const [page, setPage] = useAtom(downloadAppModalPageAtom)
  const { isOpen, closeModal } = useModalState(ModalName.GetTheApp)
  const close = useCallback(() => {
    closeModal()
    setTimeout(() => setPage(initialPage), 500)
  }, [closeModal, setPage, initialPage])

  const [unitag, setUnitag] = useState('')
  useEffect(() => {
    setPage(initialPage)
  }, [initialPage, setPage])

  const media = useMedia()
  const isSheet = media.md
  const isDismissible = !isEmbeddedWalletEnabled

  const keyboardHeight = useIOSBodyScrollLock(isOpen)

  const content = (
    <Flex data-testid={TestID.DownloadUniswapModal} position="relative" userSelect="none" width="100%">
      {/* The Page enum value corresponds to the modal page's index */}
      <AnimatedPager currentIndex={page}>
        <DownloadAppsModal onClose={close} />
        <ChooseUnitagModal
          setUnitag={setUnitag}
          goBack={isEmbeddedWalletEnabled ? undefined : () => setPage(Page.DownloadApp)}
          onClose={close}
          setPage={setPage}
        />
        <KeyManagementModal goBack={() => setPage(Page.ChooseUnitag)} onClose={close} setPage={setPage} />
        <PasskeyGenerationModal
          unitag={unitag}
          goBack={() => setPage(Page.KeyManagement)}
          onClose={close}
          setPage={setPage}
        />
      </AnimatedPager>
    </Flex>
  )

  // Render WebBottomSheet directly on mobile: <Modal>'s outer Dialog focus trap
  // fights the inner Sheet's on iOS Safari and breaks keyboard handling.
  if (isSheet) {
    return (
      <WebBottomSheet
        isOpen={isOpen}
        onClose={isDismissible ? close : undefined}
        maxHeight={`calc(100dvh - ${INTERFACE_NAV_HEIGHT}px)`}
        p={0}
      >
        <Flex pb={keyboardHeight ? `${keyboardHeight}px` : undefined}>{content}</Flex>
      </WebBottomSheet>
    )
  }

  return (
    <Modal
      skipLogImpression
      name={ModalName.DownloadApp}
      isModalOpen={isOpen}
      isDismissible={isDismissible}
      maxWidth={520}
      onClose={close}
      padding={0}
    >
      {content}
    </Modal>
  )
}

export default GetTheAppModal
