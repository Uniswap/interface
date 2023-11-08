import { transparentize } from 'polished'
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react'
import styled from 'styled-components'
import noop from 'utils/noop'

import Popover, { PopoverProps } from '../Popover'

export enum TooltipSize {
  ExtraSmall = '200px',
  Small = '256px',
  Large = '400px',
}

const getPaddingForSize = (size: TooltipSize) => {
  switch (size) {
    case TooltipSize.ExtraSmall:
      return '8px'
    case TooltipSize.Small:
      return '12px'
    case TooltipSize.Large:
      return '16px 20px'
  }
}

const TooltipContainer = styled.div<{ size: TooltipSize }>`
  max-width: ${({ size }) => size};
  width: calc(100vw - 16px);
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
