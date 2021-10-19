import styled, { Theme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { AnyStyledComponent } from 'styled-components'

import Row from '../../Row'
import Tooltip from '../../Tooltip'

export function styledValue(Value: AnyStyledComponent) {
  return styled(Value)<{ selected?: boolean; theme: Theme }>`
    border: 1px solid ${({ selected, theme }) => (selected ? theme.active : theme.outline)};
    border-radius: 0.5em;
    cursor: pointer;
    display: grid;
    grid-gap: 0.25em;
    padding: 0.5em;

    :hover,
    :focus-within {
      border-color: ${({ theme }) => theme.accent};
      opacity: 1;
    }
  `
}

interface LabelProps {
  name: string
  tooltip?: string
}

const LabelRow = styled(Row)`
  justify-content: flex-start;
  user-select: none;
`

export default function Label({ name, tooltip }: LabelProps) {
  return (
    <LabelRow gap="0.5em">
      <TYPE.subhead2>{name}</TYPE.subhead2>
      {tooltip && <Tooltip>{tooltip}</Tooltip>}
    </LabelRow>
  )
}
