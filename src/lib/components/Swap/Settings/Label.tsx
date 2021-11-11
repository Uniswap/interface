import styled, { Theme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { ReactNode } from 'react'
import { AnyStyledComponent } from 'styled-components'

import Row from '../../Row'
import Tooltip from '../../Tooltip'

export function value(Value: AnyStyledComponent) {
  return styled(Value)<{ selected?: boolean; cursor?: string; theme: Theme }>`
    border: 1px solid ${({ selected, theme }) => (selected ? theme.accent : theme.outline)};
    border-radius: ${({ theme }) => theme.borderRadius * 0.5}em;
    cursor: ${({ cursor }) => cursor ?? 'pointer'};
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
  name: ReactNode
  tooltip?: ReactNode
}

export default function Label({ name, tooltip }: LabelProps) {
  return (
    <Row gap={0.5} justify="flex-start">
      <TYPE.subhead2 userSelect="none">{name}</TYPE.subhead2>
      {tooltip && <Tooltip placement="top">{tooltip}</Tooltip>}
    </Row>
  )
}
