import { Placement } from '@popperjs/core'
import { HelpCircle, Icon } from 'lib/icons'
import styled from 'lib/theme'
import { ComponentProps, ReactNode, useState } from 'react'

import { IconButton } from './Button'
import Popover from './Popover'

const IconTooltip = styled(IconButton)`
  :hover {
    cursor: help;
  }
`

interface TooltipInterface {
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
}: TooltipInterface) {
  const [show, setShow] = useState(false)
  return (
    <Popover content={children} show={show} placement={placement} offset={offset} contained={contained}>
      <IconTooltip
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        icon={Icon}
        iconProps={iconProps}
      />
    </Popover>
  )
}
