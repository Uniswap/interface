import { Placement } from '@popperjs/core'
import { useState } from 'react'
import { HelpCircle } from 'react-feather'

import themed, { TYPE } from '../../../themed'
import { themedIcon } from '../../../themed/components'
import Popover from '../../Popover'

const ThemedHelpCircle = themed(themedIcon(HelpCircle))`
  :hover {
    cursor: help;
    opacity: 0.7;
  }
`

interface LabelProps {
  name: string
  tooltip?: string
}

const Wrapper = themed.div`
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
            <ThemedHelpCircle onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} />
          </Popover>
        </TYPE.text>
      )}
    </Wrapper>
  )
}
