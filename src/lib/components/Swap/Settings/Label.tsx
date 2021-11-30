import styled, { Theme } from 'lib/theme'
import * as ThemedText from 'lib/theme/text'
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
      <ThemedText.Subhead2 userSelect="none">{name}</ThemedText.Subhead2>
      {tooltip && (
        <Tooltip placement="top" contained>
          <ThemedText.Caption>{tooltip}</ThemedText.Caption>
        </Tooltip>
      )}
    </Row>
  )
}
