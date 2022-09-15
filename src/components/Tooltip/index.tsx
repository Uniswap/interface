import React, { ReactNode, useCallback, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Popover, { PopoverProps } from '../Popover'

const TooltipContainer = styled.div<{ width?: string; size?: number }>`
  width: ${({ width }) => width || '228px'};
  padding: 0.6rem 1rem;
  line-height: 150%;
  font-weight: 400;
  font-size: ${({ size }) => size || 14}px;
`

export const TextDashed = styled(Text)`
  border-bottom: 1px dashed ${({ theme }) => theme.border};
  width: fit-content;
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
        text ? (
          <TooltipContainer width={width} size={size}>
            {text}
          </TooltipContainer>
        ) : null
      }
      {...rest}
    />
  )
}

export function MouseoverTooltip({ children, ...rest }: Omit<TooltipProps, 'show'>) {
  const [show, setShow] = useState(false)
  const open = useCallback(() => !!rest.text && setShow(true), [setShow, rest.text])
  const close = useCallback(() => setShow(false), [setShow])
  return (
    <Tooltip {...rest} show={show}>
      <Flex onMouseEnter={open} onMouseLeave={close} alignItems="center">
        {children}
      </Flex>
    </Tooltip>
  )
}

export function MouseoverTooltipDesktopOnly(props: Omit<TooltipProps, 'show'>) {
  if (isMobile) return <>{props.children}</>

  return <MouseoverTooltip {...props} />
}
