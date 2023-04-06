import { transparentize } from 'polished'
import { ReactNode, useEffect, useState } from 'react'
import styled from 'styled-components/macro'

import Popover, { PopoverProps } from '../Popover'

// TODO(WEB-3163): migrate noops throughout web to a shared util file.
const noop = () => null

export const TooltipContainer = styled.div`
  max-width: 256px;
  cursor: default;
  padding: 0.6rem 1rem;
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
  disableHover?: boolean // disable the hover and content display
  timeout?: number
}

interface TooltipContentProps extends Omit<PopoverProps, 'content'> {
  content: ReactNode
  onOpen?: () => void
  open?: () => void
  close?: () => void
  // whether to wrap the content in a `TooltipContainer`
  wrap?: boolean
  disableHover?: boolean // disable the hover and content display
}

export default function Tooltip({ text, open, close, disableHover, ...rest }: TooltipProps) {
  return (
    <Popover
      content={
        text && (
          <TooltipContainer onMouseEnter={disableHover ? noop : open} onMouseLeave={disableHover ? noop : close}>
            {text}
          </TooltipContainer>
        )
      }
      {...rest}
    />
  )
}

function TooltipContent({ content, wrap = false, open, close, disableHover, ...rest }: TooltipContentProps) {
  return (
    <Popover
      content={
        wrap ? (
          <TooltipContainer onMouseEnter={disableHover ? noop : open} onMouseLeave={disableHover ? noop : close}>
            {content}
          </TooltipContainer>
        ) : (
          content
        )
      }
      {...rest}
    />
  )
}

/** Standard text tooltip. */
export function MouseoverTooltip({ text, disableHover, children, timeout, ...rest }: Omit<TooltipProps, 'show'>) {
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
    <Tooltip
      {...rest}
      open={open}
      close={close}
      disableHover={disableHover}
      show={show}
      text={disableHover ? null : text}
    >
      <div onMouseEnter={disableHover ? noop : open} onMouseLeave={disableHover || timeout ? noop : close}>
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
  const open = () => {
    setShow(true)
    openCallback?.()
  }
  const close = () => {
    setShow(false)
  }

  return (
    <TooltipContent
      {...rest}
      open={open}
      close={close}
      show={!disableHover && show}
      content={disableHover ? null : content}
    >
      <div onMouseEnter={open} onMouseLeave={close}>
        {children}
      </div>
    </TooltipContent>
  )
}
