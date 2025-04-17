import { InterfaceModalName } from '@uniswap/analytics-events'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ChooseUnitagModal } from 'components/NavBar/DownloadApp/Modal/ChooseUnitag'
import { GetStarted } from 'components/NavBar/DownloadApp/Modal/GetStarted'
import { GetTheApp } from 'components/NavBar/DownloadApp/Modal/GetTheApp'
import { PasskeyGenerationModal } from 'components/NavBar/DownloadApp/Modal/PasskeyGeneration'
import { useIsAccountCTAExperimentControl } from 'components/NavBar/accountCTAsExperimentUtils'
import { useCallback, useState } from 'react'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { AnimateTransition, Flex, ModalCloseIcon, TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export enum Page {
  GetApp = 0,
  GetStarted = 1,
  ChooseUnitag = 2,
  PasskeyGeneration = 3,
}

export function GetTheAppModal() {
  const [page, setPage] = useState<Page>(Page.GetStarted)
  const isOpen = useModalIsOpen(ApplicationModal.GET_THE_APP)
  const closeModal = useCloseModal()
  const close = useCallback(() => {
    closeModal()
    setTimeout(() => setPage(Page.GetStarted), 500)
  }, [closeModal, setPage])
  const showBackButton = page !== Page.GetStarted
  const accountDrawer = useAccountDrawer()

  const { isControl: isAccountCTAExperimentControl } = useIsAccountCTAExperimentControl()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const isControl = isAccountCTAExperimentControl || isEmbeddedWalletEnabled

  const [unitag, setUnitag] = useState('')

  return (
    <Trace modal={InterfaceModalName.GETTING_STARTED_MODAL}>
      <Modal
        name={ModalName.DownloadApp}
        isModalOpen={isOpen}
        maxWidth={isAccountCTAExperimentControl ? 620 : 700}
        onClose={closeModal}
        padding={0}
      >
        <Flex
          row
          position="absolute"
          top="$spacing24"
          width="100%"
          justifyContent={showBackButton ? 'space-between' : 'flex-end'}
          zIndex={zIndexes.modal}
          pl="$spacing24"
          pr="$spacing24"
        >
          {showBackButton && (
            <TouchableArea
              onPress={() => {
                setPage(page === Page.GetApp ? Page.GetStarted : page - 1)
              }}
            >
              <BackArrow size={iconSizes.icon24} color="$neutral2" hoverColor="$neutral2Hovered" />
            </TouchableArea>
          )}
          {page !== Page.PasskeyGeneration && <ModalCloseIcon onClose={close} data-testid="get-the-app-close-button" />}
        </Flex>
        <Flex
          data-testid="download-uniswap-modal"
          position="relative"
          width="100%"
          userSelect="none"
          height={isControl ? 'unset' : '520px'}
        >
          {/* The Page enum value corresponds to the modal page's index */}
          <AnimateTransition currentIndex={page} animationType={page === Page.GetStarted ? 'forward' : 'backward'}>
            <GetTheApp />
            <GetStarted
              setPage={setPage}
              toConnectWalletDrawer={() => {
                close()
                accountDrawer.open()
              }}
            />
            <ChooseUnitagModal setUnitag={setUnitag} setPage={setPage} />
            <PasskeyGenerationModal unitag={unitag} setPage={setPage} />
          </AnimateTransition>
        </Flex>
      </Modal>
    </Trace>
  )
}
