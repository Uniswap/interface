import React from 'react'
import styled, { css } from 'styled-components'
import { animated, useTransition } from 'react-spring'
import { DialogOverlay, DialogContent } from '@reach/dialog'
import '@reach/dialog/styles.css'

const AnimatedDialogOverlay = animated(DialogOverlay)
const WrappedDialogOverlay = ({ suppressClassNameWarning, ...rest }) => <AnimatedDialogOverlay {...rest} />
const StyledDialogOverlay = styled(WrappedDialogOverlay).attrs({
  suppressClassNameWarning: true
})`
  &[data-reach-dialog-overlay] {
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const FilteredDialogContent = ({ minHeight, ...rest }) => <DialogContent {...rest} />
const StyledDialogContent = styled(FilteredDialogContent)`
  &[data-reach-dialog-content] {
    margin: 0 0 2rem 0;
    border: 1px solid ${({ theme }) => theme.concreteGray};
    background-color: ${({ theme }) => theme.inputBackground};
    ${({ theme }) => theme.mediaWidth.upToMedium`margin: 0;`};
    padding: 0px;
    width: 50vw;
    max-width: 650px;
    ${({ theme }) => theme.mediaWidth.upToMedium`width: 65vw;`}
    ${({ theme }) => theme.mediaWidth.upToSmall`width: 85vw;`}
    max-height: 50vh;
    ${({ minHeight }) =>
      minHeight &&
      css`
        min-height: ${minHeight}vh;
      `}
    ${({ theme }) => theme.mediaWidth.upToMedium`max-height: 65vh;`}
    ${({ theme }) => theme.mediaWidth.upToSmall`max-height: 80vh;`}
    display: flex;
    overflow: hidden;
    border-radius: 10px;
  }
`

const HiddenCloseButton = styled.button`
  margin: 0;
  padding: 0;
  width: 0;
  height: 0;
  border: none;
`

export default function Modal({ isOpen, onDismiss, minHeight = false, initialFocusRef, children }) {
  const transitions = useTransition(isOpen, null, {
    config: { duration: 150 },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 }
  })

  return transitions.map(
    ({ item, key, props }) =>
      item && (
        <StyledDialogOverlay key={key} style={props} onDismiss={onDismiss} initialFocusRef={initialFocusRef}>
          <StyledDialogContent hidden={true} minHeight={minHeight}>
            <HiddenCloseButton onClick={onDismiss} />
            {children}
          </StyledDialogContent>
        </StyledDialogOverlay>
      )
  )
}
