import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from 'react-feather'
import styled, { css } from 'styled-components/macro'
import useResizeObserver from 'use-resize-observer'

import Row from '../Row'

export const IconHoverText = styled.span`
  color: ${({ theme }) => theme.textPrimary};
  position: absolute;
  top: 28px;
  border-radius: 8px;
  transform: translateX(-50%);
  opacity: 0;
  font-size: 12px;
  padding: 5px;
  left: 10px;
`

const widthTransition = `width ease-in 80ms`

const IconStyles = css`
  background-color: ${({ theme }) => theme.backgroundInteractive};
  transition: ${widthTransition};
  border-radius: 12px;
  display: flex;
  padding: 0;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  height: 32px;
  width: 32px;
  color: ${({ theme }) => theme.textPrimary};
  :hover {
    background-color: ${({ theme }) => theme.hoverState};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `${duration.fast} background-color ${timing.in}, ${widthTransition}`};

    ${IconHoverText} {
      opacity: 1;
    }
  }
  :active {
    background-color: ${({ theme }) => theme.backgroundSurface};
    transition: background-color 50ms linear, ${widthTransition};
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
  width: 16px;
  height: 16px;
  margin: auto;
  display: flex;
`
interface BaseProps {
  Icon: Icon
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
      <Icon strokeWidth={1.5} size={16} />
    </IconWrapper>
  </IconBlock>
)

type IconWithTextProps = (IconButtonProps | IconLinkProps) & {
  text: string
  onConfirm?: () => void
  onShowConfirm?: (on: boolean) => void
}

const TextWrapper = styled.div`
  display: flex;
  flex-shrink: 0;
  overflow: hidden;
  min-width: min-content;
`

const TextHide = styled.div`
  overflow: hidden;
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
  ...rest
}: IconWithTextProps) => {
  const [showText, setShowTextWithoutCallback] = useState(false)
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
    hidden: 0,
  })
  const dimensions = (() => {
    // once opened, we avoid updating it to prevent constant resize loop
    if (!showText) {
      dimensionsRef.current = { frame: frameObserver.width || 0, hidden: hiddenObserver.width || 0 }
    }
    return dimensionsRef.current
  })()

  // keyboard action to cancel
  useEffect(() => {
    if (!showText) return
    const isClient = typeof window !== 'undefined'
    if (!isClient) return
    if (!showText) return
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowText(false)
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', keyHandler, { capture: true })
    return () => {
      window.removeEventListener('keydown', keyHandler, { capture: true })
    }
  }, [setShowText, showText])

  const xPad = showText ? 12 : 0
  const width = showText ? dimensions.frame + dimensions.hidden + xPad : 32

  return (
    <IconBlock
      ref={frameObserver.ref}
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
    >
      <Row height="100%" gap="xs">
        <IconWrapper>
          <Icon strokeWidth={1.5} size={16} />
        </IconWrapper>

        {/* this outer div is so we can cut it off but keep the inner text width full-width so we can measure it */}
        <TextHide
          style={{
            maxWidth: showText ? dimensions.hidden : 0,
            minWidth: showText ? dimensions.hidden : 0,
          }}
        >
          <TextWrapper ref={hiddenObserver.ref}>{text}</TextWrapper>
        </TextHide>
      </Row>
    </IconBlock>
  )
}

export default IconButton
