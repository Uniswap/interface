import { ReactNode, useCallback, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Popover, { PopoverProps } from 'components/Popover'

const TooltipContainer = styled.div<{ width?: string; size?: number }>`
  width: ${({ width }) => width || '228px'};
  padding: 0.5rem 0.75rem;
  line-height: 150%;
  font-weight: 400;
  font-size: ${({ size }) => size || 12}px;
`

export const TextDashed = styled(Text)`
  border-bottom: 1px dashed ${({ theme }) => theme.border};
  width: fit-content;
`

interface TooltipProps extends Omit<PopoverProps, 'content'> {
  text: string | ReactNode
  width?: string
  size?: number
  disableTooltip?: boolean
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>
  children?: React.ReactNode
}

export default function Tooltip({ text, width, size, onMouseEnter, onMouseLeave, ...rest }: TooltipProps) {
  return (
    <Popover
      content={
        text ? (
          <TooltipContainer width={width} size={size} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            {text}
          </TooltipContainer>
        ) : null
      }
      {...rest}
    />
  )
}

export function MouseoverTooltip({ children, disableTooltip, ...rest }: Omit<TooltipProps, 'show'>) {
  const [show, setShow] = useState(false)
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null)
  const ref = useRef(null)
  const open = useCallback(() => {
    if (!!rest.text) {
      setShow(true)
      if (closeTimeout) {
        clearTimeout(closeTimeout)
        setCloseTimeout(null)
      }
    }
  }, [rest.text, closeTimeout])
  const close = useCallback(() => setCloseTimeout(setTimeout(() => setShow(false), 50)), [])
  if (disableTooltip) return <>{children}</>
  return (
    <Tooltip {...rest} show={show} onMouseEnter={open} onMouseLeave={close}>
      <Flex ref={ref} onMouseOver={open} onMouseLeave={close} alignItems="center">
        {children}
      </Flex>
    </Tooltip>
  )
}

export function MouseoverTooltipDesktopOnly(props: Omit<TooltipProps, 'show'>) {
  if (isMobile) return <>{props.children}</>

  return <MouseoverTooltip {...props} />
}
