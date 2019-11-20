import React from 'react'
import styled, { css, keyframes } from 'styled-components'
import { animated, useTransition } from 'react-spring'
import { DialogOverlay, DialogContent } from '@reach/dialog'
import { isMobile } from 'react-device-detect'
import '@reach/dialog/styles.css'
import { transparentize } from 'polished'

const AnimatedDialogOverlay = animated(DialogOverlay)
const WrappedDialogOverlay = ({ suppressClassNameWarning, mobile, ...rest }) => <AnimatedDialogOverlay {...rest} />
const StyledDialogOverlay = styled(WrappedDialogOverlay).attrs({
  suppressClassNameWarning: true
})`
  &[data-reach-dialog-overlay] {
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${({ theme }) => 'transparent'};

    ${({ mobile }) =>
      mobile &&
      css`
        align-items: flex-end;
      `}

    &::after {
      content: '';
      background-color: ${({ theme }) => theme.modalBackground};
      opacity: 0.5;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      position: absolute;
      z-index: -1;
    }
  }
`
const topToBottom = keyframes`
  0% {
    transform: translateY(200px);
  }
  100% {
    transform: translateY(0px);
  }
`

const bottomToTop = keyframes`
  0% {
    transform: translateY(0px);
  }
  100% {
    transform: translateY(200px);
  }
`

const FilteredDialogContent = ({ minHeight, maxHeight, isOpen, slideInAnimation, mobile, ...rest }) => (
  <DialogContent {...rest} />
)
const StyledDialogContent = styled(FilteredDialogContent)`
  &[data-reach-dialog-content] {
    margin: 0 0 2rem 0;
    border: 1px solid ${({ theme }) => theme.concreteGray};
    background-color: ${({ theme }) => theme.inputBackground};
    box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.95, theme.shadowColor)};
    ${({ theme }) => theme.mediaWidth.upToMedium`margin: 0;`};
    padding: 0px;
    width: 50vw;
    max-width: 650px;
    ${({ maxHeight }) =>
      maxHeight &&
      css`
        max-height: ${maxHeight}vh;
      `}
    ${({ minHeight }) =>
      minHeight &&
      css`
        min-height: ${minHeight}vh;
      `}
    display: flex;
    overflow: hidden;
    border-radius: 10px;

    ${({ theme }) => theme.mediaWidth.upToMedium`
      width: 65vw;
      max-height: 65vh;
    `}
    ${({ theme, mobile, isOpen }) => theme.mediaWidth.upToSmall`
      width:  85vw;
      max-height: 66vh;
      ${mobile &&
        css`
          width: 100vw;
          border-radius: 20px;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          animation: ${topToBottom} 0.6s cubic-bezier(0, 1, 0.5, 1); 0s;
          ${!isOpen &&
            css`
            animation: ${bottomToTop} 0.8s cubic-bezier(0, 1, 0.5, 1); 0s;
          `}
        `}
    `}
  }
`

const HiddenCloseButton = styled.button`
  margin: 0;
  padding: 0;
  width: 0;
  height: 0;
  border: none;
`

export default function Modal({ isOpen, onDismiss, minHeight = false, maxHeight = 50, initialFocusRef, children }) {
  const transitions = useTransition(isOpen, null, {
    config: { duration: 150 },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 }
  })

  return transitions.map(
    ({ item, key, props }) =>
      item && (
        <StyledDialogOverlay
          key={key}
          style={props}
          onDismiss={onDismiss}
          initialFocusRef={initialFocusRef}
          mobile={isMobile}
        >
          <StyledDialogContent
            hidden={true}
            minHeight={minHeight}
            maxHeight={maxHeight}
            isOpen={isOpen}
            mobile={isMobile}
          >
            <HiddenCloseButton onClick={onDismiss} />
            {children}
          </StyledDialogContent>
        </StyledDialogOverlay>
      )
  )
}
