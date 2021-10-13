import styled, { TYPE } from 'lib/styled'
import { styledIcon } from 'lib/styled/components'
import { useState } from 'react'
import { HelpCircle } from 'react-feather'

import Popover from '../../Popover'

const StyledHelpCircle = styled(styledIcon(HelpCircle))`
  :hover {
    cursor: help;
    opacity: 0.7;
  }
`

interface LabelProps {
  name: string
  tooltip?: string
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  user-select: none;
`

export default function Label({ name, tooltip }: LabelProps) {
  const [show, setShow] = useState(false)
  return (
    <Wrapper>
      <TYPE.label style={{ marginRight: 8 }}>{name}</TYPE.label>
      {tooltip && (
        <TYPE.text>
          <Popover content={<TYPE.detail>{tooltip}</TYPE.detail>} show={show} placement="top">
            <StyledHelpCircle onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} />
          </Popover>
        </TYPE.text>
      )}
    </Wrapper>
  )
}
