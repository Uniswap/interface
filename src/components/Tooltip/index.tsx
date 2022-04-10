import React, { useCallback, useState } from 'react'
import styled from 'styled-components/macro'
import Popover, { PopoverProps } from '../Popover'

const TooltipContainer = styled.div`
  width: 256px;
  padding: 0.6rem 1rem;
  font-weight: 400;
  word-break: break-word;
  background: ${({ theme }) => `linear-gradient(90deg, ${theme.dark0} 0%, ${theme.dark2} 35%, ${theme.dark0} 100%);`};
  border: 1px solid rgba(12, 92, 146, 0.7);
  box-shadow: 0 0 5px rgba(39, 210, 234, 0.1), 0 0 7px rgba(39, 210, 234, 0.1);
  border-radius: 8px;
`

interface TooltipProps extends Omit<PopoverProps, 'content'> {
  text: string
}

interface TooltipContentProps extends Omit<PopoverProps, 'content'> {
  content: React.ReactNode
}

export default function Tooltip({ text, ...rest }: TooltipProps) {
  return <Popover content={<TooltipContainer>{text}</TooltipContainer>} {...rest} />
}

export function TooltipContent({ content, ...rest }: TooltipContentProps) {
  return <Popover content={<TooltipContainer>{content}</TooltipContainer>} {...rest} />
}

export function MouseoverTooltip({ children, ...rest }: Omit<TooltipProps, 'show'>) {
  const [show, setShow] = useState(false)
  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])
  return (
    <Tooltip {...rest} show={show}>
      <div onMouseEnter={open} onMouseLeave={close}>
        {children}
      </div>
    </Tooltip>
  )
}

export function MouseoverTooltipContent({ content, children, ...rest }: Omit<TooltipContentProps, 'show'>) {
  const [show, setShow] = useState(false)
  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])
  return (
    <TooltipContent {...rest} show={show} content={content}>
      <div
        style={{ display: 'inline-block', lineHeight: 0, padding: '0.25rem' }}
        onMouseEnter={open}
        onMouseLeave={close}
      >
        {children}
      </div>
    </TooltipContent>
  )
}
