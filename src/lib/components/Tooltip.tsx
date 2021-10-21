import styled, { icon } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { ReactNode, useMemo, useState } from 'react'
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
  children: string | ReactNode
}

export default function Tooltip({ icon: Icon = HelpCircleIcon, children }: TooltipInterface) {
  const [show, setShow] = useState(false)
  const content = useMemo(
    () => (typeof children === 'string' ? <TYPE.body2>{children}</TYPE.body2> : children),
    [children]
  )
  return (
    <Popover content={content} show={show} placement="top">
      <IconWrapper>
        <Icon onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} />
      </IconWrapper>
    </Popover>
  )
}
