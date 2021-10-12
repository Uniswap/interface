import { HelpCircle } from 'react-feather'

import themed, { TYPE } from '../../../themed'
import { themedIcon } from '../../../themed/components'

const ThemedHelpCircle = themed(themedIcon(HelpCircle))`
  margin-left: 8px;

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
  return (
    <Wrapper>
      <TYPE.label>{name}</TYPE.label>
      {/* TODO: Implement the tooltip */}
      {tooltip && <ThemedHelpCircle />}
    </Wrapper>
  )
}
