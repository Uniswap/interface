import { DialogContent, DialogOverlay } from '@reach/dialog'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import styled from 'lib/styled-components'
import React, { KeyboardEvent, useCallback, useRef } from 'react'
import { animated, easings, useSpring, useTransition } from 'react-spring'
import { useGesture } from 'react-use-gesture'
import { Z_INDEX } from 'theme/zIndex'
import { isMobile } from 'utilities/src/platform'

export const MODAL_TRANSITION_DURATION = 200

const AnimatedDialogOverlay = animated(DialogOverlay)

const StyledDialogOverlay = styled(AnimatedDialogOverlay)<{ $scrollOverlay?: boolean }>`
  will-change: transform, opacity;
  &[data-reach-dialog-overlay] {
    z-index: ${Z_INDEX.modalBackdrop};
    background-color: transparent;
    overflow: hidden;

    display: flex;
    align-items: center;
    @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
      align-items: flex-end;
    }
    overflow-y: ${({ $scrollOverlay }) => $scrollOverlay && 'scroll'};
    justify-content: center;

    background-color: ${({ theme }) => theme.scrim};
  }
`

type Dimension = number | string

function dimensionsToCss(dimensions: Dimension) {
  if (typeof dimensions === 'number') {
    return `${dimensions}px`
  }
  return dimensions
}

type StyledDialogProps = {
  $height?: Dimension
  $minHeight?: Dimension
  $maxHeight?: Dimension
  $scrollOverlay?: boolean
  $hideBorder?: boolean
  $maxWidth: Dimension
}

const AnimatedDialogContent = animated(DialogContent)
const StyledDialogContent = styled(AnimatedDialogContent)<StyledDialogProps>`
  overflow-y: auto;

  &[data-reach-dialog-content] {
    margin: auto;
    background-color: ${({ theme }) => theme.surface2};
    border: ${({ theme, $hideBorder }) => !$hideBorder && `1px solid ${theme.surface3}`};
    box-shadow: ${({ theme }) => theme.deprecated_deepShadow};
    padding: 0px;
    width: 50vw;
    overflow-y: auto;
    overflow-x: hidden;
    ${({ $height }) => $height && `height: ${dimensionsToCss($height)};`}
    ${({ $maxHeight }) => $maxHeight && `max-height: ${dimensionsToCss($maxHeight)};`}
    ${({ $minHeight }) => $minHeight && `min-height: ${dimensionsToCss($minHeight)};`}
    ${({ $maxWidth }) => $maxWidth && `max-width: ${dimensionsToCss($maxWidth)};`}
    display: ${({ $scrollOverlay }) => ($scrollOverlay ? 'inline-table' : 'flex')};
    border-radius: 20px;

    @media screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
      width: 65vw;
    }
    @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
      margin: 0;
      width: 100vw;
      border-radius: 20px;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
`

interface ModalProps {
  isOpen: boolean
  onDismiss?: () => void
  onSwipe?: () => void
  height?: Dimension
  minHeight?: Dimension
  maxHeight?: Dimension
  maxWidth?: Dimension
  initialFocusRef?: React.RefObject<any>
  children?: React.ReactNode
  $scrollOverlay?: boolean
  hideBorder?: boolean
  slideIn?: boolean
}

export default function Modal({
  isOpen,
  onDismiss,
  minHeight,
  maxHeight = '90vh',
  maxWidth = 420,
  height,
  initialFocusRef,
  children,
  onSwipe = onDismiss,
  $scrollOverlay,
  hideBorder = false,
  slideIn,
}: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => (isOpen && onDismiss ? onDismiss() : undefined))

  const handleEscape = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape' && isOpen && onDismiss) {
        onDismiss()
      }
    },
    [isOpen, onDismiss],
  )

  const fadeTransition = useTransition(isOpen, {
    config: { duration: MODAL_TRANSITION_DURATION },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  })

  const slideTransition = useTransition(isOpen, {
    config: { duration: MODAL_TRANSITION_DURATION, easing: easings.easeInOutCubic },
    from: { transform: 'translateY(40px)' },
    enter: { transform: 'translateY(0px)' },
    leave: { transform: 'translateY(40px)' },
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
    <div tabIndex={0} onKeyUp={handleEscape}>
      {fadeTransition(
        ({ opacity }, item) =>
          item && (
            <StyledDialogOverlay
              style={{ opacity: opacity.to({ range: [0.0, 1.0], output: [0, 1] }) }}
              onDismiss={onDismiss}
              initialFocusRef={initialFocusRef}
              unstable_lockFocusAcrossFrames={false}
              $scrollOverlay={$scrollOverlay}
            >
              {slideTransition(
                (styles, item) =>
                  item && (
                    <StyledDialogContent
                      ref={ref}
                      {...(isMobile
                        ? {
                            ...bind(),
                            style: { transform: y.interpolate((y) => `translateY(${(y as number) > 0 ? y : 0}px)`) },
                          }
                        : slideIn
                          ? { style: styles }
                          : {})}
                      aria-label="dialog"
                      $height={height}
                      $minHeight={minHeight}
                      $maxHeight={maxHeight}
                      $scrollOverlay={$scrollOverlay}
                      $hideBorder={hideBorder}
                      $maxWidth={maxWidth}
                    >
                      {/* prevents the automatic focusing of inputs on mobile by the reach dialog */}
                      {!initialFocusRef && isMobile ? <div tabIndex={1} /> : null}
                      {children}
                    </StyledDialogContent>
                  ),
              )}
            </StyledDialogOverlay>
          ),
      )}
    </div>
  )
}
