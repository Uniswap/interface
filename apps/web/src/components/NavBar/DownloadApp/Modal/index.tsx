import { InterfaceModalName } from '@uniswap/analytics-events'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import Modal from 'components/Modal'
import { useIsAccountCTAExperimentControl } from 'components/NavBar/accountCTAsExperimentUtils'
import { GetStarted } from 'components/NavBar/DownloadApp/Modal/GetStarted'
import { GetTheApp } from 'components/NavBar/DownloadApp/Modal/GetTheApp'
import styled from 'lib/styled-components'
import { useCallback, useState } from 'react'
import { ArrowLeft, X } from 'react-feather'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { ClickableTamaguiStyle } from 'theme/components'
import { AnimateTransition, Flex, styled as tamaguiStyled } from 'ui/src'
import { iconSizes, zIndices } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'

const StyledModal = styled(Modal)`
  display: block;
`

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
})

enum Page {
  GetStarted = 'GetStarted',
  GetApp = 'GetApp',
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

  return (
    <Trace modal={InterfaceModalName.GETTING_STARTED_MODAL}>
      <StyledModal
        isOpen={isOpen}
        maxWidth={isAccountCTAExperimentControl ? 620 : 700}
        slideIn
        onDismiss={closeModal}
        hideBorder
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
          <CloseButton
            filled={!isAccountCTAExperimentControl && !showBackButton}
            onClick={close}
            data-testid="get-the-app-close-button"
          />
        </Flex>
        <Flex
          data-testid="download-uniswap-modal"
          position="relative"
          width="100%"
          userSelect="none"
          height={isAccountCTAExperimentControl ? 'unset' : '520px'}
        >
          <AnimateTransition
            currentIndex={page === Page.GetStarted ? 0 : 1}
            animationType={page === Page.GetStarted ? 'forward' : 'backward'}
          >
            <GetStarted
              toAppDownload={() => setPage(Page.GetApp)}
              toConnectWalletDrawer={() => {
                close()
                accountDrawer.open()
              }}
            />
            <GetTheApp />
          </AnimateTransition>
        </Flex>
      </StyledModal>
    </Trace>
  )
}
