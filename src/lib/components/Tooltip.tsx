import { Placement } from '@popperjs/core'
import { HelpCircle, Icon } from 'lib/icons'
import styled from 'lib/theme'
import { ComponentProps, ReactNode, useCallback, useState } from 'react'

import { IconButton } from './Button'
import Popover from './Popover'

export interface TooltipHandlers {
  onMouseEnter: () => void
  onMouseLeave: () => void
  onFocus: () => void
  onBlur: () => void
}

export function useTooltip(): [boolean, (show: boolean) => void, TooltipHandlers] {
  const [show, setShow] = useState(false)
  const enable = useCallback(() => setShow(true), [])
  const disable = useCallback(() => setShow(false), [])
  return [show, setShow, { onMouseEnter: enable, onMouseLeave: disable, onFocus: enable, onBlur: disable }]
}

const IconTooltip = styled(IconButton)`
  cursor: help;
`

interface TooltipProps {
  icon?: Icon
  iconProps?: ComponentProps<Icon>
  children: ReactNode
  placement?: Placement
  offset?: number
  contained?: true
}

export default function Tooltip({
  icon: Icon = HelpCircle,
  iconProps,
  children,
  placement = 'auto',
  offset,
  contained,
}: TooltipProps) {
  const [showTooltip, , tooltipProps] = useTooltip()
  return (
    <Popover content={children} show={showTooltip} placement={placement} offset={offset} contained={contained}>
      <IconTooltip icon={Icon} iconProps={iconProps} {...tooltipProps} />
    </Popover>
  )
}
