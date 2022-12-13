import { DialogContent, DialogOverlay } from '@reach/dialog'
import React from 'react'
import { animated, useSpring, useTransition } from 'react-spring'
import { useGesture } from 'react-use-gesture'
import styled, { css } from 'styled-components/macro'
import { Z_INDEX } from 'theme/zIndex'

import { isMobile } from '../../utils/userAgent'

const AnimatedDialogOverlay = animated(DialogOverlay)

const StyledDialogOverlay = styled(AnimatedDialogOverlay)<{ scrollOverlay?: boolean }>`
  &[data-reach-dialog-overlay] {
    z-index: ${Z_INDEX.modalBackdrop};
    background-color: transparent;
    overflow: hidden;

    display: flex;
    align-items: center;
    overflow-y: ${({ scrollOverlay }) => scrollOverlay && 'scroll'};
    justify-content: center;

    background-color: ${({ theme }) => theme.backgroundScrim};
  }
`

type StyledDialogProps = {
  $minHeight?: number | false
  $maxHeight?: number
  $isBottomSheet?: boolean
  $scrollOverlay?: boolean
  $hideBorder?: boolean
  $maxWidth: number
}

const AnimatedDialogContent = animated(DialogContent)
const StyledDialogContent = styled(AnimatedDialogContent)<StyledDialogProps>`
  overflow-y: auto;

  &[data-reach-dialog-content] {
    margin: auto;
    background-color: ${({ theme }) => theme.deprecated_bg0};
    border: ${({ theme, $hideBorder }) => !$hideBorder && `1px solid ${theme.deprecated_bg1}`};
    box-shadow: ${({ theme }) => theme.deepShadow};
    padding: 0px;
    width: 50vw;
    overflow-y: auto;
    overflow-x: hidden;

    align-self: ${({ $isBottomSheet }) => $isBottomSheet && 'flex-end'};
    max-width: ${({ $maxWidth }) => $maxWidth}px;
    ${({ $maxHeight }) =>
      $maxHeight &&
      css`
        max-height: ${$maxHeight}vh;
      `}
    ${({ $minHeight }) =>
      $minHeight &&
      css`
        min-height: ${$minHeight}vh;
      `}
    display: ${({ $scrollOverlay }) => ($scrollOverlay ? 'inline-table' : 'flex')};
    border-radius: 20px;
    ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
      width: 65vw;
      margin: auto;
    `}
    ${({ theme, $isBottomSheet }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
      width:  85vw;
      ${
        $isBottomSheet &&
        css`
          width: 100vw;
          border-radius: 20px;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        `
      }
    `}
  }
`

interface ModalProps {
  isOpen: boolean
  onDismiss?: () => void
  onSwipe?: () => void
  minHeight?: number | false
  maxHeight?: number
  maxWidth?: number
  initialFocusRef?: React.RefObject<any>
  children?: React.ReactNode
  scrollOverlay?: boolean
  hideBorder?: boolean
  isBottomSheet?: boolean
}

export default function Modal({
  isOpen,
  onDismiss,
  minHeight = false,
  maxHeight = 90,
  maxWidth = 420,
  initialFocusRef,
  children,
  onSwipe = onDismiss,
  scrollOverlay,
  isBottomSheet = isMobile,
  hideBorder = false,
}: ModalProps) {
  const fadeTransition = useTransition(isOpen, {
    config: { duration: 200 },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  })

  const [{ y }, set] = useSpring(() => ({ y: 0, config: { mass: 1, tension: 210, friction: 20 } }))
  const bind = useGesture({
    onDrag: (state) => {
      set({
        y: state.down ? state.movement[1] : 0,
      })
      if (state.movement[1] > 300 || (state.velocity > 3 && state.direction[1] > 0)) {
        onSwipe?.()
      }
    },
  })

  return (
    <>
      {fadeTransition(
        ({ opacity }, item) =>
          item && (
            <StyledDialogOverlay
              style={{ opacity: opacity.to({ range: [0.0, 1.0], output: [0, 1] }) }}
              onDismiss={onDismiss}
              initialFocusRef={initialFocusRef}
              unstable_lockFocusAcrossFrames={false}
              scrollOverlay={scrollOverlay}
            >
              <StyledDialogContent
                {...(isMobile
                  ? {
                      ...bind(),
                      style: { transform: y.interpolate((y) => `translateY(${(y as number) > 0 ? y : 0}px)`) },
                    }
                  : {})}
                aria-label="dialog"
                $minHeight={minHeight}
                $maxHeight={maxHeight}
                $isBottomSheet={isBottomSheet}
                $scrollOverlay={scrollOverlay}
                $hideBorder={hideBorder}
                $maxWidth={maxWidth}
              >
                {/* prevents the automatic focusing of inputs on mobile by the reach dialog */}
                {!initialFocusRef && isMobile ? <div tabIndex={1} /> : null}
                {children}
              </StyledDialogContent>
            </StyledDialogOverlay>
          )
      )}
    </>
  )
}
