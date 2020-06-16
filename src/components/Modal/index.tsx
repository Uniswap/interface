import React from 'react'
import styled, { css } from 'styled-components'
import { animated, useTransition, useSpring } from 'react-spring'
import { Spring } from 'react-spring/renderprops'

import { DialogOverlay, DialogContent } from '@reach/dialog'
import { isMobile } from 'react-device-detect'
import '@reach/dialog/styles.css'
import { transparentize } from 'polished'
import { useGesture } from 'react-use-gesture'

const AnimatedDialogOverlay = animated(DialogOverlay)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledDialogOverlay = styled(({ mobile, ...rest }) => <AnimatedDialogOverlay {...rest} />)<{ mobile: boolean }>`
  &[data-reach-dialog-overlay] {
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    overflow: hidden;

    ${({ mobile }) =>
      mobile &&
      css`
        align-items: flex-end;
      `}

    &::after {
      content: '';
      background-color: ${({ theme }) => theme.modalBG};
      opacity: 0.5;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      position: fixed;
      z-index: -1;
    }
  }
`

// destructure to not pass custom props to Dialog DOM element
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledDialogContent = styled(({ minHeight, maxHeight, mobile, isOpen, ...rest }) => (
  <DialogContent {...rest} />
)).attrs({
  'aria-label': 'dialog'
})`
  &[data-reach-dialog-content] {
    margin: 0 0 2rem 0;
    border: 1px solid ${({ theme }) => theme.bg1};
    background-color: ${({ theme }) => theme.bg1};
    box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.95, theme.shadow1)};
    padding: 0px;
    width: 50vw;

    max-width: 420px;
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
    border-radius: 20px;
    ${({ theme }) => theme.mediaWidth.upToMedium`
      width: 65vw;
      margin: 0;
    `}
    ${({ theme, mobile }) => theme.mediaWidth.upToSmall`
      width:  85vw;
      ${mobile &&
        css`
          width: 100vw;
          border-radius: 20px;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        `}
    `}
  }
`

interface ModalProps {
  isOpen: boolean
  onDismiss: () => void
  minHeight?: number | false
  maxHeight?: number
  initialFocusRef?: React.RefObject<any>
  children?: React.ReactNode
}

export default function Modal({
  isOpen,
  onDismiss,
  minHeight = false,
  maxHeight = 50,
  initialFocusRef = null,
  children
}: ModalProps) {
  const transitions = useTransition(isOpen, null, {
    config: { duration: 200 },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 }
  })

  const [{ y }, set] = useSpring(() => ({ y: 0, config: { mass: 1, tension: 210, friction: 20 } }))
  const bind = useGesture({
    onDrag: state => {
      let velocity = state.velocity
      if (velocity < 1) {
        velocity = 1
      }
      if (velocity > 8) {
        velocity = 8
      }
      set({
        y: state.down ? state.movement[1] : 0
      })
      if (velocity > 3 && state.direction[1] > 0) {
        onDismiss()
      }
    }
  })

  if (isMobile) {
    return (
      <>
        {transitions.map(
          ({ item, key, props }) =>
            item && (
              <StyledDialogOverlay
                key={key}
                style={props}
                onDismiss={onDismiss}
                initialFocusRef={initialFocusRef}
                mobile={true}
              >
                <Spring // animation for entrance and exit
                  from={{
                    transform: isOpen ? 'translateY(200px)' : 'translateY(100px)'
                  }}
                  to={{
                    transform: isOpen ? 'translateY(0px)' : 'translateY(200px)'
                  }}
                >
                  {props => (
                    <animated.div
                      {...bind()}
                      style={{
                        transform: y.interpolate(y => `translateY(${y > 0 ? y : 0}px)`)
                      }}
                    >
                      <StyledDialogContent
                        aria-label="dialog content"
                        style={props}
                        hidden={true}
                        minHeight={minHeight}
                        maxHeight={maxHeight}
                        mobile={isMobile}
                      >
                        {children}
                      </StyledDialogContent>
                    </animated.div>
                  )}
                </Spring>
              </StyledDialogOverlay>
            )
        )}
      </>
    )
  } else {
    return (
      <>
        {transitions.map(
          ({ item, key, props }) =>
            item && (
              <StyledDialogOverlay key={key} style={props} onDismiss={onDismiss} initialFocusRef={initialFocusRef}>
                <StyledDialogContent
                  aria-label="dialog content"
                  hidden={true}
                  minHeight={minHeight}
                  maxHeight={maxHeight}
                  isOpen={isOpen}
                >
                  {children}
                </StyledDialogContent>
              </StyledDialogOverlay>
            )
        )}
      </>
    )
  }
}
