import { transparentize } from 'polished'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import styled from 'styled-components/macro'

import Popover, { PopoverProps } from '../Popover'

export const TooltipContainer = styled.div`
  max-width: 256px;
  cursor: default;
  padding: 0.6rem 1rem;
  font-weight: 400;
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
  noOp?: () => void
  disableHover?: boolean // disable the hover and content display
  timeout?: number
}

interface TooltipContentProps extends Omit<PopoverProps, 'content'> {
  content: ReactNode
  onOpen?: () => void
  // whether to wrap the content in a `TooltipContainer`
  wrap?: boolean
  disableHover?: boolean // disable the hover and content display
}

export default function Tooltip({ text, open, close, noOp, disableHover, ...rest }: TooltipProps) {
  return (
    <Popover
      content={
        text && (
          <TooltipContainer onMouseEnter={disableHover ? noOp : open} onMouseLeave={disableHover ? noOp : close}>
            {text}
          </TooltipContainer>
        )
      }
      {...rest}
    />
  )
}

function TooltipContent({ content, wrap = false, ...rest }: TooltipContentProps) {
  return <Popover content={wrap ? <TooltipContainer>{content}</TooltipContainer> : content} {...rest} />
}

/** Standard text tooltip. */
export function MouseoverTooltip({ text, disableHover, children, timeout, ...rest }: Omit<TooltipProps, 'show'>) {
  const [show, setShow] = useState(false)
  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])

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

  const noOp = () => null
  return (
    <Tooltip
      {...rest}
      open={open}
      close={close}
      noOp={noOp}
      disableHover={disableHover}
      show={show}
      text={disableHover ? null : text}
    >
      <div onMouseEnter={disableHover ? noOp : open} onMouseLeave={disableHover || timeout ? noOp : close}>
        {children}
      </div>
    </Tooltip>
  )
}

/** Tooltip that displays custom content. */
export function MouseoverTooltipContent({
  content,
  children,
  onOpen: openCallback = undefined,
  disableHover,
  ...rest
}: Omit<TooltipContentProps, 'show'>) {
  const [show, setShow] = useState(false)
  const open = useCallback(() => {
    setShow(true)
    openCallback?.()
  }, [openCallback])
  const close = useCallback(() => setShow(false), [setShow])
  return (
    <TooltipContent {...rest} show={show} content={disableHover ? null : content}>
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
