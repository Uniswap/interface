import styled, { Theme } from 'lib/theme'
import { styledIcon } from 'lib/theme/components'
import TYPE from 'lib/theme/type'
import { useState } from 'react'
import { HelpCircle } from 'react-feather'

import Popover from '../../Popover'
import Row from '../../Row'

export const Value = styled.div<{ selected?: boolean; theme: Theme }>`
  border: 1px solid ${({ selected, theme }) => (selected ? theme.active : theme.outline)};
  border-radius: 0.5em;
  display: grid;
  grid-gap: 0.25em;
  padding: 0.5em;
  cursor: pointer;
`

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

const LabelRow = styled(Row)`
  justify-content: flex-start;
  user-select: none;
`

export default function Label({ name, tooltip }: LabelProps) {
  const [show, setShow] = useState(false)
  return (
    <LabelRow gap="0.5em">
      <TYPE.subhead2>{name}</TYPE.subhead2>
      {tooltip && (
        <TYPE.body2>
          <Popover content={<TYPE.body2>{tooltip}</TYPE.body2>} show={show} placement="top">
            <StyledHelpCircle onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} />
          </Popover>
        </TYPE.body2>
      )}
    </LabelRow>
  )
}
