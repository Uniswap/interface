import { isMobileWeb } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { atom, useAtom } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatedPager, Flex, useMedia, WebBottomSheet } from 'ui/src'
import { HeightAnimator } from 'ui/src/animations/components/HeightAnimator'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ChooseUnitagModal } from '~/components/NavBar/DownloadApp/Modal/ChooseUnitag'
import { Page } from '~/components/NavBar/DownloadApp/Modal/constants'
import { DownloadAppsModal } from '~/components/NavBar/DownloadApp/Modal/DownloadApps'
import { KeyManagementModal } from '~/components/NavBar/DownloadApp/Modal/KeyManagement'
import { PasskeyGenerationModal } from '~/components/NavBar/DownloadApp/Modal/PasskeyGeneration'
import { useAndroidKeyboardViewportFix } from '~/hooks/useAndroidKeyboardViewportFix'
import { useIOSBodyScrollLock } from '~/hooks/useIOSBodyScrollLock'
import { useModalState } from '~/hooks/useModalState'
import { useAppSelector } from '~/state/hooks'

export const downloadAppModalPageAtom = atom<Page>(Page.DownloadApp)

export function GetTheAppModal() {
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const initialInnerPage = useAppSelector((state) => {
    const modal = state.application.openModal
    return modal?.name === ModalName.GetTheApp ? modal.initialState?.initialInnerPage : undefined
  })
  const showMobileDownload = initialInnerPage === 'mobile'
  const initialPage = showMobileDownload || !isEmbeddedWalletEnabled ? Page.DownloadApp : Page.ChooseUnitag

  const [page, setPage] = useAtom(downloadAppModalPageAtom)
  const { isOpen, closeModal } = useModalState(ModalName.GetTheApp)
  // Keep this fixed bottom sheet on-screen when the Android soft keyboard opens (unitag step). No-op on
  // iOS/desktop; on Android resizes-content also drives useIOSBodyScrollLock's keyboardHeight to ~0.
  useAndroidKeyboardViewportFix(isOpen)

  // Read `initialPage` through a ref inside the 500ms timeout so the post-close reset uses
  // the recomputed value (after Redux clears `openModal` and `showMobileDownload` flips
  // false) instead of the stale closure captured when `close` was created.
  const initialPageRef = useRef(initialPage)
  useEffect(() => {
    initialPageRef.current = initialPage
  }, [initialPage])

  const close = useCallback(() => {
    closeModal()
    setTimeout(() => setPage(initialPageRef.current), 500)
  }, [closeModal, setPage])

  const [unitag, setUnitag] = useState('')
  useEffect(() => {
    setPage(initialPage)
  }, [initialPage, setPage])

  const media = useMedia()
  const isSheet = media.md
  const isDismissible = !(isEmbeddedWalletEnabled && !isMobileWeb) || showMobileDownload

  const keyboardHeight = useIOSBodyScrollLock(isOpen)

  const content = (
    <Flex data-testid={TestID.DownloadUniswapModal} position="relative" userSelect="none" width="100%">
      <HeightAnimator animation="quickLong">
        {/* The Page enum value corresponds to the modal page's index */}
        <AnimatedPager animation="quickLong" currentIndex={page}>
          <DownloadAppsModal onClose={close} initialInnerPage={showMobileDownload ? 'mobile' : undefined} />
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
      </HeightAnimator>
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
        px="$spacing24"
        pb="$spacing24"
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
      maxWidth={480}
      onClose={close}
      padding="$spacing32"
    >
      {content}
    </Modal>
  )
}

export default GetTheAppModal
