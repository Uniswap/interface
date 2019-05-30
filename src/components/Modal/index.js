import React from 'react'
import styled, { css } from 'styled-components'
import { animated, useTransition } from 'react-spring'
import { DialogOverlay, DialogContent } from '@reach/dialog'
import '@reach/dialog/styles.css'

const AnimatedDialogOverlay = animated(DialogOverlay)
const StyledDialogOverlay = styled(AnimatedDialogOverlay).attrs({
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
    ${({ theme }) => theme.mediaWidth.upToMedium`margin: 0;`}
    padding: 0;
    width: 50vw;
    max-width: 650px;
    ${({ theme }) => theme.mediaWidth.upToMedium`width: 75vw;`}
    ${({ theme }) => theme.mediaWidth.upToSmall`width: 90vw;`}
    ${({ minHeight }) =>
      minHeight &&
      css`
        min-height: ${minHeight}vh;
      `}
    max-height: 50vh;
    ${({ theme }) => theme.mediaHeight.upToMedium`max-height: 75vh;`}
    ${({ theme }) => theme.mediaHeight.upToSmall`max-height: 90vh;`}
    display: flex;
    overflow: hidden;
    border-radius: 1.5rem;
  }
`

const HiddenCloseButton = styled.button`
  margin: 0;
  padding: 0;
  width: 0;
  height: 0;
  border: none;
`

export default function Modal({ isOpen, onDismiss, minHeight = 50, initialFocusRef, children }) {
  const transitions = useTransition(isOpen, null, {
    config: { duration: 125 },
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
