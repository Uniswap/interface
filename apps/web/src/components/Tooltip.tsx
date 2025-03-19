import Popover, { PopoverProps } from 'components/Popover'
import styled from 'lib/styled-components'
import { transparentize } from 'polished'
import { Fragment, PropsWithChildren, ReactNode, memo, useCallback, useEffect, useState } from 'react'
import { Flex } from 'ui/src'
import noop from 'utilities/src/react/noop'

export enum TooltipSize {
  ExtraSmall = '200px',
  Small = '256px',
  Large = '400px',
  Max = 'max-content',
}

// eslint-disable-next-line consistent-return
const getPaddingForSize = (size: TooltipSize) => {
  switch (size) {
    case TooltipSize.ExtraSmall:
    case TooltipSize.Max:
      return '8px'
    case TooltipSize.Small:
      return '12px'
    case TooltipSize.Large:
      return '16px 20px'
  }
}

const TooltipContainer = styled.div<{ size: TooltipSize }>`
  max-width: ${({ size }) => size};
  width: ${({ size }) => (size === TooltipSize.Max ? 'auto' : `calc(100vw - 16px)`)};
  cursor: default;
  padding: ${({ size }) => getPaddingForSize(size)};
  pointer-events: auto;

  color: ${({ theme }) => theme.neutral1};
  font-weight: 485;
  font-size: 12px;
  line-height: 16px;
  word-break: break-word;

  background: ${({ theme }) => theme.surface1};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.surface3};
  box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.9, theme.shadow1)};
`

type MouseoverTooltipProps = Omit<PopoverProps, 'content' | 'show'> &
  PropsWithChildren<{
    text: ReactNode
    size?: TooltipSize
    disabled?: boolean
    timeout?: number
    placement?: PopoverProps['placement']
    onOpen?: () => void
    forceShow?: boolean
  }>

export const MouseoverTooltip = memo(function MouseoverTooltip(props: MouseoverTooltipProps) {
  const { text, disabled, children, onOpen, forceShow, timeout, ...rest } = props
  const [show, setShow] = useState(false)
  const open = () => {
    setShow(true)
    onOpen?.()
  }
  const close = () => setShow(false)

  useEffect(() => {
    if (show && timeout) {
      const tooltipTimer = setTimeout(() => {
        setShow(false)
      }, timeout)

      return () => {
        clearTimeout(tooltipTimer)
      }
    }
    return undefined
  }, [timeout, show])

  if (disabled) {
    return <Fragment>{children}</Fragment>
  }

  return (
    <Popover
      content={
        text && (
          <TooltipContainer
            size={props.size ?? TooltipSize.Small}
            onMouseEnter={disabled ? noop : open}
            onMouseLeave={disabled ? noop : close}
          >
            {text}
          </TooltipContainer>
        )
      }
      show={forceShow || show}
      {...rest}
    >
      <Flex onMouseEnter={disabled ? noop : open} onMouseLeave={disabled || timeout ? noop : close}>
        {children}
      </Flex>
    </Popover>
  )
})

const CursorFollowerContainer = styled.div`
  position: fixed;
  pointer-events: none;
  transform: translate(-50%, -50%);
`

type MouseFollowTooltipProps = Omit<MouseoverTooltipProps, 'timeout'>

export function MouseFollowTooltip(props: MouseFollowTooltipProps) {
  const [position, setPosition] = useState<{ x?: number; y?: number }>({
    x: undefined,
    y: undefined,
  })
  const { text, disabled, children, onOpen, forceShow, ...rest } = props
  const [show, setShow] = useState(false)
  const open = () => {
    setShow(true)
    onOpen?.()
  }
  const close = () => setShow(false)

  const handleMouseMove = useCallback((event: MouseEvent) => {
    setPosition({ x: event.clientX, y: event.clientY })
  }, [])

  useEffect(() => {
    if (show && !disabled) {
      document.addEventListener('mousemove', handleMouseMove)
    }
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [disabled, handleMouseMove, show])

  return (
    <>
      <CursorFollowerContainer
        style={{
          left: position.x ? `${position.x}px` : undefined,
          top: position.y ? `${position.y + 16}px` : undefined,
        }}
      >
        <MouseoverTooltip {...rest} text={disabled ? null : text} forceShow={forceShow} />
      </CursorFollowerContainer>
      <Flex onMouseEnter={disabled ? noop : open} onMouseLeave={disabled ? noop : close}>
        {children}
      </Flex>
    </>
  )
}
