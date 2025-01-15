import { InterfaceModalName } from '@uniswap/analytics-events'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { GetStarted } from 'components/NavBar/DownloadApp/Modal/GetStarted'
import { GetTheApp } from 'components/NavBar/DownloadApp/Modal/GetTheApp'
import { PasskeyGenerationModal } from 'components/NavBar/DownloadApp/Modal/PasskeyGeneration'
import { useIsAccountCTAExperimentControl } from 'components/NavBar/accountCTAsExperimentUtils'
import { useCallback, useState } from 'react'
import { ArrowLeft, X } from 'react-feather'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { ClickableTamaguiStyle } from 'theme/components'
import { AnimateTransition, Flex, styled as tamaguiStyled } from 'ui/src'
import { iconSizes, zIndices } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const HeaderActionIcon = {
  margin: 4,
  color: '$neutral1',
  ...ClickableTamaguiStyle,
}

const CloseButton = tamaguiStyled(X, {
  ...HeaderActionIcon,
  size: iconSizes.icon24,

  variants: {
    filled: {
      true: {
        color: 'white',
        borderRadius: '100%',
        backgroundColor: '$scrim',
        padding: '$spacing4',
        margin: '$none',
        size: iconSizes.icon32,
      },
      false: {},
    },
  },
})

const BackButton = tamaguiStyled(ArrowLeft, {
  ...HeaderActionIcon,
  color: '$neutral3',
})

export enum Page {
  GetStarted,
  GetApp,
  PasskeyGeneration,
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
          zIndex={zIndices.modal}
          pl="$spacing24"
          pr="$spacing24"
        >
          {showBackButton && <BackButton onClick={() => setPage(Page.GetStarted)} size={iconSizes.icon24} />}
          {page !== Page.PasskeyGeneration && (
            <CloseButton
              filled={(!isAccountCTAExperimentControl || isEmbeddedWalletEnabled) && !showBackButton}
              onClick={close}
              data-testid="get-the-app-close-button"
            />
          )}
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
            <GetStarted
              setPage={setPage}
              toConnectWalletDrawer={() => {
                close()
                accountDrawer.open()
              }}
            />
            <GetTheApp />
            <PasskeyGenerationModal setPage={setPage} />
          </AnimateTransition>
        </Flex>
      </Modal>
    </Trace>
  )
}
