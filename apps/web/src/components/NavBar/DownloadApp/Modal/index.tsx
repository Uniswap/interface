import { InterfaceModalName } from '@uniswap/analytics-events'
import { AnimatedSlider } from 'components/AnimatedSlider'
import Modal from 'components/Modal'
import { GetStarted } from 'components/NavBar/DownloadApp/Modal/GetStarted'
import { GetTheApp } from 'components/NavBar/DownloadApp/Modal/GetTheApp'
import Row from 'components/Row'
import styled, { css } from 'lib/styled-components'
import { useCallback, useState } from 'react'
import { ArrowLeft, X } from 'react-feather'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { ClickableStyle } from 'theme/components'
import { iconSizes } from 'ui/src/theme'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'

const StyledModal = styled(Modal)`
  display: block;
`
const Wrapper = styled.div`
  position: relative;
  padding: 24px;
  width: 100%;
  user-select: none;
`
const HeaderActionIcon = css`
  margin: 4px;
  color: ${({ theme }) => theme.neutral1};
  ${ClickableStyle};
`
const CloseButton = styled(X)`
  ${HeaderActionIcon}
`
const BackButton = styled(ArrowLeft)`
  ${HeaderActionIcon}
`

enum Page {
  GetStarted = 'GetStarted',
  GetApp = 'GetApp',
}

export function GetTheAppModal() {
  const [page, setPage] = useState<Page>(Page.GetStarted)
  const isOpen = useModalIsOpen(ApplicationModal.GET_THE_APP)
  const isLegacyNav = !useFeatureFlag(FeatureFlags.NavRefresh)
  const closeModal = useCloseModal()
  const close = useCallback(() => {
    closeModal()
    setTimeout(() => setPage(Page.GetStarted), 500)
  }, [closeModal, setPage])
  const showBackButton = !isLegacyNav && page !== Page.GetStarted

  return (
    <Trace modal={InterfaceModalName.GETTING_STARTED_MODAL}>
      <StyledModal isOpen={isOpen} maxWidth={620} slideIn onDismiss={closeModal}>
        <Wrapper>
          <Row justify={showBackButton ? 'space-between' : 'end'}>
            {showBackButton && <BackButton onClick={() => setPage(Page.GetStarted)} size={iconSizes.icon24} />}
            <CloseButton onClick={close} size={iconSizes.icon24} data-testid="get-the-app-close-button" />
          </Row>
          {isLegacyNav ? (
            <GetTheApp />
          ) : (
            <AnimatedSlider
              currentIndex={page === Page.GetStarted ? 0 : 1}
              slideDirection={page === Page.GetStarted ? 'forward' : 'backward'}
            >
              <GetStarted toAppDownload={() => setPage(Page.GetApp)} />
              <GetTheApp />
            </AnimatedSlider>
          )}
        </Wrapper>
      </StyledModal>
    </Trace>
  )
}
