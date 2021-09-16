import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import Popover, { PopoverProps } from '../Popover'

const TooltipContainer = styled.div`
  width: 228px;
  line-height: 150%;
  font-weight: 400;
`

interface TooltipProps extends PopoverProps {
  text?: string
}

export default function Tooltip({ text, ...rest }: Omit<TooltipProps, 'content'>) {
  return <Popover content={<TooltipContainer>{text}</TooltipContainer>} {...rest} />
}

export function CustomTooltip({ content, ...rest }: PopoverProps) {
  return <Popover offsetY={3} placement={'bottom'} content={content} {...rest} />
}

export function MouseoverTooltip({ children, content, ...rest }: Omit<TooltipProps, 'show'>) {
  const [show, setShow] = useState(false)
  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])
  return (
    <CustomTooltip content={content} {...rest} show={show}>
      <div onMouseEnter={open} onMouseLeave={close}>
        {children}
      </div>
    </CustomTooltip>
  )
}
