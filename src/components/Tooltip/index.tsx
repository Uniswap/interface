import { transparentize } from 'polished'
import { ReactNode, useEffect, useState } from 'react'
import styled from 'styled-components/macro'
import noop from 'utils/noop'

import Popover, { PopoverProps } from '../Popover'

export enum TooltipSize {
  Small = '256px',
  Large = '400px',
}

const getPaddingForSize = (size: TooltipSize) => {
  switch (size) {
    case TooltipSize.Small:
      return '12px'
    case TooltipSize.Large:
      return '16px 20px'
  }
}

const TooltipContainer = styled.div<{ size: TooltipSize }>`
  max-width: ${({ size }) => size};
  cursor: default;
  padding: ${({ size }) => getPaddingForSize(size)};
  pointer-events: auto;

  color: ${({ theme }) => theme.textPrimary};
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  word-break: break-word;

  background: ${({ theme }) => theme.backgroundSurface};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.backgroundInteractive};
  box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.9, theme.shadow1)};
`

interface TooltipProps extends Omit<PopoverProps, 'content'> {
  text: ReactNode
  open?: () => void
  close?: () => void
  size?: TooltipSize
  disabled?: boolean
  timeout?: number
}

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

/** Standard text tooltip. */
export function MouseoverTooltip({ text, disabled, children, timeout, ...rest }: Omit<TooltipProps, 'show'>) {
  const [show, setShow] = useState(false)
  const open = () => text && setShow(true)
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
    <Tooltip {...rest} open={open} close={close} disabled={disabled} show={show} text={disabled ? null : text}>
      <div onMouseEnter={disabled ? noop : open} onMouseLeave={disabled || timeout ? noop : close}>
        {children}
      </div>
    </Tooltip>
  )
}
