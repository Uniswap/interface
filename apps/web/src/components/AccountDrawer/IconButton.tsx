import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from 'react-feather'
import styled, { DefaultTheme, css } from 'styled-components'
import useResizeObserver from 'use-resize-observer'

import { TRANSITION_DURATIONS } from '../../theme/styles'
import Row from '../Row'

export const IconHoverText = styled.span`
  color: ${({ theme }) => theme.neutral1};
  position: absolute;
  top: 28px;
  border-radius: 8px;
  transform: translateX(-50%);
  opacity: 0;
  font-size: 12px;
  padding: 5px;
  left: 10px;
`

const getWidthTransition = ({ theme }: { theme: DefaultTheme }) =>
  `width ${theme.transition.timing.inOut} ${theme.transition.duration.fast}`

const IconStyles = css<{ hideHorizontal?: boolean }>`
  background-color: ${({ theme }) => theme.surface1};
  transition: ${getWidthTransition};
  border-radius: 12px;
  display: flex;
  padding: 0;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  height: 32px;
  width: ${({ hideHorizontal }) => (hideHorizontal ? '0px' : '32px')};
  color: ${({ theme }) => theme.neutral2};
  :hover {
    background-color: ${({ theme }) => theme.surface2};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `${duration.fast} background-color ${timing.in}, ${getWidthTransition}`};

    ${IconHoverText} {
      opacity: 1;
    }
  }
  :active {
    background-color: ${({ theme }) => theme.surface1};
    transition: background-color ${({ theme }) => theme.transition.duration.fast} linear, ${getWidthTransition};
  }
`

const IconBlockLink = styled.a`
  ${IconStyles};
`

const IconBlockButton = styled.button`
  ${IconStyles};
  border: none;
  outline: none;
`

const IconWrapper = styled.span`
  width: 24px;
  height: 24px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
`
interface BaseProps {
  Icon: Icon
  hideHorizontal?: boolean
  children?: React.ReactNode
}

interface IconLinkProps extends React.ComponentPropsWithoutRef<'a'>, BaseProps {}
interface IconButtonProps extends React.ComponentPropsWithoutRef<'button'>, BaseProps {}

type IconBlockProps = React.ComponentPropsWithoutRef<'a' | 'button'>

const IconBlock = forwardRef<HTMLAnchorElement | HTMLDivElement, IconBlockProps>(function IconBlock(props, ref) {
  if ('href' in props) {
    return <IconBlockLink ref={ref as React.ForwardedRef<HTMLAnchorElement>} {...props} />
  }
  // ignoring 'button' 'type' conflict between React and styled-components
  // @ts-ignore
  return <IconBlockButton ref={ref} {...props} />
})

const IconButton = ({ Icon, ...rest }: IconButtonProps | IconLinkProps) => (
  <IconBlock {...rest}>
    <IconWrapper>
      <Icon size={24} />
    </IconWrapper>
  </IconBlock>
)

type IconWithTextProps = (IconButtonProps | IconLinkProps) & {
  text: string
  onConfirm?: () => void
  onShowConfirm?: (on: boolean) => void
  dismissOnHoverOut?: boolean
  dismissOnHoverDurationMs?: number
}

const TextWrapper = styled.div`
  display: flex;
  flex-shrink: 0;
  overflow: hidden;
  min-width: min-content;
  font-weight: 485;
`

const TextHide = styled.div`
  overflow: hidden;
  transition: width ${({ theme }) => theme.transition.timing.inOut} ${({ theme }) => theme.transition.duration.fast},
    max-width ${({ theme }) => theme.transition.timing.inOut} ${({ theme }) => theme.transition.duration.fast};
`

/**
 * Allows for hiding and showing some text next to an IconButton
 * Note that for width transitions to animate in CSS we need to always specify the width (no auto)
 * so there's resize observing and measuring going on here.
 */
export const IconWithConfirmTextButton = ({
  Icon,
  text,
  onConfirm,
  onShowConfirm,
  onClick,
  dismissOnHoverOut,
  dismissOnHoverDurationMs = TRANSITION_DURATIONS.slow,
  ...rest
}: IconWithTextProps) => {
  const [showText, setShowTextWithoutCallback] = useState(false)
  const [frame, setFrame] = useState<HTMLElement | null>()
  const frameObserver = useResizeObserver<HTMLElement>()
  const hiddenObserver = useResizeObserver<HTMLElement>()

  const setShowText = useCallback(
    (val: boolean) => {
      setShowTextWithoutCallback(val)
      onShowConfirm?.(val)
    },
    [onShowConfirm]
  )

  const dimensionsRef = useRef({
    frame: 0,
    innerText: 0,
  })
  const dimensions = (() => {
    // once opened, we avoid updating it to prevent constant resize loop
    if (!showText) {
      dimensionsRef.current = {
        frame: frameObserver.width || 0,
        innerText: hiddenObserver.width || 0,
      }
    }
    return dimensionsRef.current
  })()

  // keyboard action to cancel
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!showText || !frame) return

    const closeAndPrevent = (e: Event) => {
      setShowText(false)
      e.preventDefault()
      e.stopPropagation()
    }

    const clickHandler = (e: MouseEvent) => {
      const { target } = e
      const shouldClose = !(target instanceof HTMLElement) || !frame.contains(target)
      if (shouldClose) {
        closeAndPrevent(e)
      }
    }

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAndPrevent(e)
      }
    }

    window.addEventListener('click', clickHandler, { capture: true })
    window.addEventListener('keydown', keyHandler, { capture: true })

    return () => {
      window.removeEventListener('click', clickHandler, { capture: true })
      window.removeEventListener('keydown', keyHandler, { capture: true })
    }
  }, [frame, setShowText, showText])

  const xPad = showText ? 8 : 0
  const width = showText ? dimensions.frame + dimensions.innerText + xPad * 2 : 32
  const mouseLeaveTimeout = useRef<NodeJS.Timeout>()

  return (
    <IconBlock
      ref={(node) => {
        frameObserver.ref(node)
        setFrame(node)
      }}
      {...rest}
      style={{
        width,
        paddingLeft: xPad,
        paddingRight: xPad,
      }}
      // @ts-ignore MouseEvent is valid, its a subset of the two mouse events,
      // even manually typing this all out more specifically it still gets mad about any casting for some reason
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        if (showText) {
          onConfirm?.()
        } else {
          onClick?.(e)
          setShowText(!showText)
        }
      }}
      {...(dismissOnHoverOut && {
        onMouseLeave() {
          mouseLeaveTimeout.current = setTimeout(() => {
            setShowText(false)
          }, dismissOnHoverDurationMs)
        },
        onMouseEnter() {
          if (mouseLeaveTimeout.current) {
            clearTimeout(mouseLeaveTimeout.current)
          }
        },
      })}
    >
      <Row height="100%" align="center">
        <IconWrapper>
          <Icon width={24} height={24} />
        </IconWrapper>

        {/* this outer div is so we can cut it off but keep the inner text width full-width so we can measure it */}
        <TextHide
          style={{
            maxWidth: showText ? dimensions.innerText : 0,
            width: showText ? dimensions.innerText : 0,
            margin: showText ? 'auto' : 0,
            // this negative transform offsets for the shift it does due to being 0 width
            transform: showText ? undefined : `translateX(-8px)`,
            minWidth: showText ? dimensions.innerText : 0,
          }}
        >
          <TextWrapper ref={hiddenObserver.ref}>{text}</TextWrapper>
        </TextHide>
      </Row>
    </IconBlock>
  )
}

export default IconButton
