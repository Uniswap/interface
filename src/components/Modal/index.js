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
      /* position: absolute; */
      position: fixed;
      z-index: -1;
    }
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
      margin: 0;
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
    config: { duration: 200 },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 }
  })

  const [{ xy }, set] = useSpring(() => ({ xy: [0, 0] }))
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
        xy: state.down ? state.movement : [0, 0],
        config: { mass: 1, tension: 210, friction: 20 }
      })
      if (velocity > 3 && state.direction[1] > 0) {
        onDismiss()
      }
    }
  })

  if (isMobile) {
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
                  style={{ transform: xy.interpolate((x, y) => `translate3d(${0}px,${y > 0 ? y : 0}px,0)`) }}
                >
                  <StyledDialogContent
                    style={props}
                    hidden={true}
                    minHeight={minHeight}
                    maxHeight={maxHeight}
                    mobile={isMobile}
                  >
                    <HiddenCloseButton onClick={onDismiss} />
                    {children}
                  </StyledDialogContent>
                </animated.div>
              )}
            </Spring>
          </StyledDialogOverlay>
        )
    )
  } else {
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
}
