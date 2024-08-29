import { Placement } from '@popperjs/core'
import Popover, { PopoverProps } from 'components/Popover'
import styled from 'lib/styled-components'
import { transparentize } from 'polished'
import { PropsWithChildren, ReactNode, useCallback, useEffect, useState } from 'react'
import noop from 'utilities/src/react/noop'

export enum TooltipSize {
  ExtraSmall = '200px',
  Small = '256px',
  Large = '400px',
  Max = 'max-content',
}

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

type TooltipProps = Omit<PopoverProps, 'content'> & {
  text: ReactNode
  open?: () => void
  close?: () => void
  size?: TooltipSize
  disabled?: boolean
  timeout?: number
  placement?: Placement
}

// TODO(WEB-2024)
// Migrate to MouseoverTooltip and move this component inline to MouseoverTooltip
export default function Tooltip({ text, open, close, disabled, size = TooltipSize.Small, ...rest }: TooltipProps) {
  return (
    <Popover
      content={
        text && (
          <TooltipContainer size={size} onMouseEnter={disabled ? noop : open} onMouseLeave={disabled ? noop : close}>
            {text}
          </TooltipContainer>
        )
      }
      {...rest}
    />
  )
}

// TODO(WEB-2024)
// Do not pass through PopoverProps. Prefer higher-level interface to control MouseoverTooltip.
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

export function MouseoverTooltip(props: MouseoverTooltipProps) {
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
    return
  }, [timeout, show])

  return (
    <Tooltip
      {...rest}
      open={open}
      close={close}
      disabled={disabled}
      show={forceShow || show}
      text={disabled ? null : text}
    >
      <div onMouseEnter={disabled ? noop : open} onMouseLeave={disabled || timeout ? noop : close}>
        {children}
      </div>
    </Tooltip>
  )
}

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
    <div>
      <CursorFollowerContainer
        style={{
          left: position.x ? `${position.x}px` : undefined,
          top: position.y ? `${position.y + 16}px` : undefined,
        }}
      >
        <Tooltip
          {...rest}
          open={open}
          close={close}
          disabled={disabled}
          show={forceShow || show}
          text={disabled ? null : text}
        />
      </CursorFollowerContainer>
      <div onMouseEnter={disabled ? noop : open} onMouseLeave={disabled ? noop : close}>
        {children}
      </div>
    </div>
  )
}
