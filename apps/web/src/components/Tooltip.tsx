import Popover, { PopoverProps } from 'components/Popover'
import styled from 'lib/styled-components'
import { transparentize } from 'polished'
import { Fragment, memo, PropsWithChildren, ReactNode, useEffect, useState } from 'react'
import { Flex } from 'ui/src'
import { noop } from 'utilities/src/react/noop'

export enum TooltipSize {
  ExtraSmall = '200px',
  Small = '256px',
  Large = '400px',
  Max = 'max-content',
}

// eslint-disable-next-line consistent-return
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

const TooltipContainer = styled.div<{ size: TooltipSize; padding?: number }>`
  max-width: ${({ size }) => size};
  width: ${({ size }) => (size === TooltipSize.Max ? 'auto' : `calc(100vw - 16px)`)};
  cursor: default;
  padding: ${({ size, padding }) => (padding !== undefined ? `${padding}px` : getPaddingForSize(size))};
  pointer-events: auto;

  color: ${({ theme }) => theme.neutral1};
  font-weight: 485;
  font-size: 12px;
  line-height: 16px;
  word-break: break-word;

  background: ${({ theme }) => theme.surface1};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.surface3};
  box-shadow:
    0px 6px 12px -3px ${({ theme }) => transparentize(0.95, theme.shadow1)},
    0px 2px 5px -2px ${({ theme }) => transparentize(0.97, theme.shadow1)};
`

type MouseoverTooltipProps = Omit<PopoverProps, 'content' | 'show'> &
  PropsWithChildren<{
    text: ReactNode
    size?: TooltipSize
    disabled?: boolean
    timeout?: number
    placement?: PopoverProps['placement']
    onOpen?: () => void
    forceShow?: boolean
    padding?: number
  }>

export const MouseoverTooltip = memo(function MouseoverTooltip(props: MouseoverTooltipProps) {
  const { text, disabled, children, onOpen, forceShow, timeout, padding, ...rest } = props
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
    return undefined
  }, [timeout, show])

  if (disabled) {
    return <Fragment>{children}</Fragment>
  }

  return (
    <Popover
      content={
        text && (
          <TooltipContainer
            padding={padding}
            size={props.size ?? TooltipSize.Small}
            onMouseEnter={open}
            onMouseLeave={close}
          >
            {text}
          </TooltipContainer>
        )
      }
      show={forceShow || show}
      {...rest}
    >
      <Flex onMouseEnter={open} onMouseLeave={timeout ? noop : close}>
        {children}
      </Flex>
    </Popover>
  )
})
