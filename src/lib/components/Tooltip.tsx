import styled from 'lib/theme'
import { styledIcon } from 'lib/theme/components'
import TYPE from 'lib/theme/type'
import { ReactNode, useMemo, useState } from 'react'
import { HelpCircle, Icon } from 'react-feather'

import Popover from './Popover'

const StyledHelpCircle = styledIcon(HelpCircle)

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

export default function Tooltip({ icon: Icon = StyledHelpCircle, children }: TooltipInterface) {
  const [show, setShow] = useState(false)
  const content = useMemo(
    () => (typeof children === 'string' ? <TYPE.body2>{children}</TYPE.body2> : children),
    [children]
  )
  return (
    <TYPE.body2>
      <Popover content={content} show={show} placement="top">
        <IconWrapper>
          <Icon onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} />
        </IconWrapper>
      </Popover>
    </TYPE.body2>
  )
}
