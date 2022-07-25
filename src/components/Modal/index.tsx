import React from 'react'
import styled from 'styled-components'
import { animated, useTransition, useSpring } from 'react-spring'
import { DialogOverlay, DialogContent } from '@reach/dialog'
import { isMobile } from 'react-device-detect'
import '@reach/dialog/styles.css'
import { transparentize } from 'polished'
import { useGesture } from 'react-use-gesture'

const AnimatedDialogOverlay = animated(DialogOverlay)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledDialogOverlay = styled(AnimatedDialogOverlay)<{ zindex: string | number }>`
  &[data-reach-dialog-overlay] {
    z-index: ${({ zindex }) => zindex};
    background-color: transparent;
    overflow: hidden;

    display: flex;
    align-items: center;
    justify-content: center;

    background-color: ${({ theme }) => theme.modalBG};
  }
`

const AnimatedDialogContent = animated(DialogContent)
// destructure to not pass custom props to Dialog DOM element
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledDialogContent = styled(({ minHeight, maxHeight, maxWidth, width, mobile, isOpen, ...rest }) => (
  <AnimatedDialogContent {...rest} />
)).attrs({
  'aria-label': 'dialog',
})`
  overflow-y: ${({ mobile }) => (mobile ? 'scroll' : 'hidden')};

  &[data-reach-dialog-content] {
    margin: 0 0 2rem 0;
    background-color: ${({ theme }) => theme.tableHeader};
    box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.95, theme.shadow1)};
    padding: 0px;
    width: ${({ width }) => width || '50vw'};
    overflow-y: ${({ mobile }) => (mobile ? 'scroll' : 'hidden')};
    overflow-x: hidden;
    align-self: ${({ mobile }) => (mobile ? 'flex-end' : 'center')};
    max-width: ${({ maxWidth }) => (maxWidth && !isNaN(maxWidth) ? `${maxWidth}px` : maxWidth)};
    ${({ maxHeight }) =>
      maxHeight &&
      `
        max-height: ${maxHeight && !isNaN(maxHeight) ? `${maxHeight}vh` : maxHeight};
      `}
    ${({ minHeight }) =>
      minHeight &&
      `
        min-height: ${minHeight}vh;
      `}
    display: flex;
    border-radius: 20px;
    ${({ theme, width }) => theme.mediaWidth.upToMedium`
      width:  ${width || '65vw'};
      margin: 0;
    `}
    ${({ theme, mobile }) => theme.mediaWidth.upToSmall`
      width:  85vw;
      ${mobile &&
        `
          width: 100vw;
          border-radius: 20px;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        `}
    `}
  }
`

export interface ModalProps {
  isOpen: boolean
  onDismiss: () => void
  minHeight?: number | false
  maxHeight?: number | string
  maxWidth?: number | string
  width?: string
  zindex?: number | string
  initialFocusRef?: React.RefObject<any>
  className?: string
  children?: React.ReactNode
  transition?: boolean
}

export default function Modal({
  isOpen,
  onDismiss,
  minHeight = false,
  maxHeight = 90,
  maxWidth = 420,
  width,
  initialFocusRef,
  className,
  children,
  transition = true,
  zindex = 100,
}: ModalProps) {
  const fadeTransition = useTransition(isOpen, null, {
    config: { duration: transition ? 200 : 0 },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  })

  const [{ y }, set] = useSpring(() => ({ y: 0, config: { mass: 1, tension: 210, friction: 20 } }))
  const bind = useGesture({
    onDrag: state => {
      set({
        y: state.down ? state.movement[1] : 0,
      })
      if (state.movement[1] > 300 || (state.velocity > 3 && state.direction[1] > 0)) {
        onDismiss()
      }
    },
  })

  return (
    <>
      {fadeTransition.map(
        ({ item, key, props }) =>
          item && (
            <StyledDialogOverlay zindex={zindex} key={key} style={props} onDismiss={onDismiss}>
              <StyledDialogContent
                {...(isMobile
                  ? {
                      ...bind(),
                      style: { transform: y.interpolate(y => `translateY(${(y as number) > 0 ? y : 0}px)`) },
                    }
                  : {})}
                aria-label="dialog content"
                minHeight={minHeight}
                maxHeight={maxHeight}
                maxWidth={maxWidth}
                width={width}
                mobile={isMobile}
                className={className}
              >
                {/* prevents the automatic focusing of inputs on mobile by the reach dialog */}
                {!initialFocusRef && isMobile ? <div tabIndex={1} /> : null}
                {children}
              </StyledDialogContent>
            </StyledDialogOverlay>
          ),
      )}
    </>
  )
}
