import { Placement } from '@popperjs/core'
import styled, { icon } from 'lib/theme'
import { ReactNode, useState } from 'react'
import { HelpCircle, Icon } from 'react-feather'

import Popover from './Popover'

const HelpCircleIcon = icon(HelpCircle)

const IconWrapper = styled.div`
  :hover {
    cursor: help;
    opacity: 0.7;
  }
`

interface TooltipInterface {
  icon?: Icon
  children: ReactNode
  placement: Placement
  contained?: true
}

export default function Tooltip({
  icon: Icon = HelpCircleIcon,
  children,
  placement = 'auto',
  contained,
}: TooltipInterface) {
  const [show, setShow] = useState(false)
  return (
    <Popover content={children} show={show} placement={placement} contained={contained}>
      <IconWrapper>
        <Icon onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} />
      </IconWrapper>
    </Popover>
  )
}
