import styled, { css, Theme, ThemedText } from 'lib/theme'
import { ReactNode } from 'react'
import { AnyStyledComponent } from 'styled-components'

import Row from '../../Row'
import Tooltip from '../../Tooltip'

export const optionCss = (selected: boolean) => css`
  border: 1px solid ${({ theme }) => (selected ? theme.accent : theme.outline)};
  border-radius: ${({ theme }) => theme.borderRadius * 0.75}em;
  color: ${({ theme }) => theme.primary};
  display: grid;
  grid-gap: 0.25em;
  padding: 0.5em;

  :hover {
    border-color: ${({ theme }) => theme.onHover(selected ? theme.accent : theme.outline)};
  }
`

export function value(Value: AnyStyledComponent) {
  return styled(Value)<{ selected?: boolean; cursor?: string; theme: Theme }>`
    cursor: ${({ cursor }) => cursor ?? 'pointer'};
  `
}

interface LabelProps {
  name: ReactNode
  tooltip?: ReactNode
}

export function Label({ name, tooltip }: LabelProps) {
  return (
    <Row gap={0.5} justify="flex-start">
      <ThemedText.Subhead2 userSelect="none" color="primary">
        {name}
      </ThemedText.Subhead2>
      {tooltip && (
        <Tooltip placement="top" contained>
          <ThemedText.Caption>{tooltip}</ThemedText.Caption>
        </Tooltip>
      )}
    </Row>
  )
}
