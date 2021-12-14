import { Placement } from '@popperjs/core'
import { HelpCircle, Icon } from 'lib/icons'
import styled from 'lib/theme'
import { ReactNode, useState } from 'react'

import { IconButton } from './Button'
import Popover from './Popover'

const IconTooltip = styled(IconButton)`
  :hover {
    cursor: help;
  }
`

interface TooltipInterface {
  icon?: Icon
  children: ReactNode
  placement: Placement
  contained?: true
}

export default function Tooltip({
  icon: Icon = HelpCircle,
  children,
  placement = 'auto',
  contained,
}: TooltipInterface) {
  const [show, setShow] = useState(false)
  return (
    <Popover content={children} show={show} placement={placement} contained={contained}>
      <IconTooltip
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        icon={Icon}
      />
    </Popover>
  )
}
