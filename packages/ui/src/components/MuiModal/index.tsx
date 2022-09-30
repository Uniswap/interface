import Fade from '@mui/material/Fade'
import Modal from '@mui/material/Modal'
import { transparentize } from 'polished'
import React, { useCallback } from 'react'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

export const StyledModalOverlay = styled(Flex)`
  z-index: 2;
  backdrop-filter: blur(10px);
  background-color: transparent;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom left, rgba(46 48 48 / 40%), rgba(35 35 38 / 45%));
  top: 0;
  left: 0;
  position: fixed;
  width: 100vw;
  height: 100vh;
`

// destructure to not pass custom props to Dialog DOM element
// const StyledDialogContent = styled(({ maxWidth, minHeight, maxHeight, minWidth, mobile, isOpen, ...rest }) => <AnimatedDialogContent {...rest} />).attrs({

export const StyledModalContent = styled(({ width, maxWidth, minWidth, maxHeight, minHeight, mobile, ...rest }) => (
  <Flex {...rest}></Flex>
))`
  // &[data-reach-dialog-content] {
  margin: 0;
  //   background-color: ${({ theme }) => theme.bg0};
  //   border: 1px solid ${({ theme }) => theme.bg1};
  //   box-shadow: 0 0 1px 1px ${({ theme }) => transparentize(0.2, theme.shadow1)};
  border-radius: 1rem;
  padding: 0px;
  overflow: hidden;
  align-self: ${({ mobile }) => (mobile ? 'flex-end' : 'center')};
  width: 50vw;
  max-width: 32rem;
  ${({ maxWidth }) => `max-width: ${maxWidth};`}
  ${({ maxHeight }) =>
    maxHeight &&
    css`
      max-height: ${typeof maxHeight === 'number' ? maxHeight + 'vh' : maxHeight};
    `}
  ${({ minHeight }) =>
    minHeight &&
    css`
      min-height: ${typeof minHeight === 'number' ? minHeight + 'vh' : minHeight};
    `}
  display: flex;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 70vw;
    margin: 0;
    padding: 0;
  `}
  ${({ theme, mobile }) => theme.mediaWidth.upToSmall`
      width:  85vw;
      ${
        mobile &&
        css`
          width: 100vw;
          border-radius: 1rem;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        `
      }
    `}
  ${({ theme, mobile }) => theme.mediaWidth.upToExtraSmall`
    width: calc(100vw - 20px);
  `}
`

const ModalContentWrapper = styled(Flex)`
  background-color: #19242f;
  border-radius: 1.6rem;
  display: flex;
  flex: 1;
  position: relative;
  width: 100%;
  max-height: calc(100% - 40px);
  overflow-y: auto;
`

const StyledText = styled.p`
  flex: 1 1 auto;
  color: ${({ theme }) => theme.text1};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0.5rem 0 0.25rem;
  font-size: 1rem;
  width: fit-content;
  font-weight: 600;
`

interface ModalProps {
  isOpen: boolean
  onDismiss?: () => void
  minHeight?: number | string
  maxWidth?: number | string
  maxHeight?: number | string
  minWidth?: number | string
  children?: React.ReactNode
  setIsOpen?(openOrNot: false): any
  title?: string
}

export default function MuiModal({
  isOpen,
  setIsOpen,
  onDismiss,
  minHeight = 'fit-content',
  maxHeight = '90vh',
  maxWidth,
  minWidth,
  children,
  title
}: ModalProps) {
  const onClick = useCallback(
    (event) => {
      const wrapper = document.getElementById('modal-content-wrapper')
      if (wrapper && !wrapper?.contains(event.target)) {
        onDismiss && onDismiss()
      }
    },
    [onDismiss]
  )
  return (
    <>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={isOpen}
        closeAfterTransition
        BackdropProps={{
          timeout: 500
        }}
      >
        <Fade in={isOpen}>
          <StyledModalOverlay onClick={onClick}>
            <StyledModalContent
              id="modal-content-wrapper"
              flexDirection="column"
              overflow="hidden"
              minHeight={minHeight}
              maxWidth={maxWidth}
              maxHeight={maxHeight}
              minWidth={minWidth}
            >
              {title && (
                <Flex height="40px" width="100%" justifyContent="flex-end">
                  <StyledText
                    style={{
                      lineHeight: '40px',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'center'
                    }}
                  >
                    <a>{title}</a>
                  </StyledText>
                  {/* <CircledCloseIcon onClick={() => setIsOpen && setIsOpen(false)} /> */}
                </Flex>
              )}
              <ModalContentWrapper>{children}</ModalContentWrapper>
            </StyledModalContent>
          </StyledModalOverlay>
        </Fade>
      </Modal>
    </>
  )
}
