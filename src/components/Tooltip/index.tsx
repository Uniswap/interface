import React, { useCallback, useState, ReactNode } from 'react'
import styled from 'styled-components'
import Popover, { PopoverProps } from '../Popover'
import { Flex } from 'rebass'

const TooltipContainer = styled.div<{ width?: string; size?: number }>`
  width: ${({ width }) => width || '228px'};
  padding: 0.6rem 1rem;
  line-height: 150%;
  font-weight: 400;
  font-size: ${({ size }) => size || 14}px;
`

interface TooltipProps extends Omit<PopoverProps, 'content'> {
  text: string | ReactNode
  width?: string
  size?: number
}

export default function Tooltip({ text, width, size, ...rest }: TooltipProps) {
  return (
    <Popover
      content={
        <TooltipContainer width={width} size={size}>
          {text}
        </TooltipContainer>
      }
      {...rest}
    />
  )
}

export function MouseoverTooltip({ children, ...rest }: Omit<TooltipProps, 'show'>) {
  const [show, setShow] = useState(false)
  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])
  return (
    <Tooltip {...rest} show={show}>
      <Flex onMouseEnter={open} onMouseLeave={close} alignItems="center">
        {children}
      </Flex>
    </Tooltip>
  )
}
