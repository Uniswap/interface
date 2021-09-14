import { transparentize } from 'polished'
import { ReactNode, useCallback, useState } from 'react'
import styled from 'styled-components/macro'
import Popover, { PopoverProps } from '../Popover'

export const TooltipContainer = styled.div<{ width?: string }>`
  width: ${({ width }) => width ?? '256px'};
  padding: 0.6rem 1rem;
  font-weight: 400;
  word-break: break-word;

  background: ${({ theme }) => theme.bg2};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.bg3};
  box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.9, theme.shadow1)};
`

interface TooltipProps extends Omit<PopoverProps, 'content'> {
  text: ReactNode
}

interface TooltipContentProps extends Omit<PopoverProps, 'content'> {
  content: ReactNode
  Container?: ({ children }: { children: ReactNode }) => JSX.Element
}

export default function Tooltip({ text, ...rest }: TooltipProps) {
  return <Popover content={<TooltipContainer>{text}</TooltipContainer>} {...rest} />
}

function TooltipContent({ content, Container, ...rest }: TooltipContentProps) {
  return (
    <Popover
      content={Container ? Container({ children: content }) : <TooltipContainer>{content}</TooltipContainer>}
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
