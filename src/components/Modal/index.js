import React, { useRef } from 'react'
import styled, { css } from 'styled-components'
import { animated, useTransition } from 'react-spring'
import { DialogOverlay, DialogContent } from '@reach/dialog'
import '@reach/dialog/styles.css'

const AnimatedDialogOverlay = animated(DialogOverlay)
const StyledDialogOverlay = styled(AnimatedDialogOverlay).attrs({
  suppressClassNameWarning: true
})`
  &[data-reach-dialog-overlay] {
    z-index: 1050;
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

const Wrapper = styled.div`
  display: flex;
  width: 100%;

  :focus {
    outline: none;
  }
`

export default function Modal({ isOpen, onDismiss, minHeight = 50, initialFocusRef = undefined, children }) {
  const ref = useRef()

  const transitions = useTransition(isOpen, null, {
    config: { duration: 125 },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 }
  })

  return transitions.map(
    ({ item, key, props }) =>
      item && (
        <StyledDialogOverlay key={key} style={props} onDismiss={onDismiss} initialFocusRef={initialFocusRef || ref}>
          <StyledDialogContent minHeight={minHeight}>
            <Wrapper tabIndex="0" ref={ref}>
              {children}
            </Wrapper>
          </StyledDialogContent>
        </StyledDialogOverlay>
      )
  )
}
