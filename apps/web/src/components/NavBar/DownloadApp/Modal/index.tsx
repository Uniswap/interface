import { AnimatedSlider } from 'components/AnimatedSlider'
import Modal from 'components/Modal'
import { GetStarted } from 'components/NavBar/DownloadApp/Modal/GetStarted'
import { GetTheApp } from 'components/NavBar/DownloadApp/Modal/GetTheApp'
import Row from 'components/Row'
import { useCallback, useState } from 'react'
import { ArrowLeft, X } from 'react-feather'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

const StyledModal = styled(Modal)`
  display: block;
`
const Wrapper = styled.div`
  position: relative;
  padding: 32px;
  width: 100%;
  user-select: none;
`
const CloseIcon = styled(X)`
  width: 25px;
  height: 25px;
  stroke: ${({ theme }) => theme.neutral2};
`
const CloseButton = styled.div`
  width: 32px;
  height: 32px;
  padding: 4px;
  cursor: pointer;
  :hover {
    ${CloseIcon} {
      stroke: ${({ theme }) => theme.neutral1};
    }
  }
`
const BackIcon = styled(ArrowLeft)`
  stroke: ${({ theme }) => theme.neutral2};
`
const BackButton = styled.div`
  width: 32px;
  height: 32px;
  padding: 4px;
  cursor: pointer;
  :hover {
    ${BackIcon} {
      stroke: ${({ theme }) => theme.neutral1};
    }
  }
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
    <StyledModal isOpen={isOpen} maxWidth={620} slideIn onDismiss={closeModal}>
      <Wrapper>
        <Row justify={showBackButton ? 'space-between' : 'end'}>
          {showBackButton && (
            <BackButton onClick={() => setPage(Page.GetStarted)}>
              <BackIcon />
            </BackButton>
          )}
          <CloseButton onClick={close} data-testid="get-the-app-close-button">
            <CloseIcon />
          </CloseButton>
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
  )
}
