import styled, { css, ThemedText } from 'lib/theme'
import { ReactNode } from 'react'
import { AnyStyledComponent } from 'styled-components'

import Row from '../../Row'
import Tooltip from '../../Tooltip'

export const optionCss = (selected: boolean) => css`
  border: 1px solid ${({ theme }) => (selected ? theme.active : theme.outline)};
  border-radius: ${({ theme }) => theme.borderRadius * 0.75}em;
  color: ${({ theme }) => theme.primary} !important;
  display: grid;
  grid-gap: 0.25em;
  padding: 0.5em 0.625em;

  :enabled:hover {
    border-color: ${({ theme }) => theme.onHover(selected ? theme.active : theme.outline)};
  }
`

export function value(Value: AnyStyledComponent) {
  return styled(Value)<{ selected?: boolean; cursor?: string }>`
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
      <ThemedText.Subhead2>{name}</ThemedText.Subhead2>
      {tooltip && (
        <Tooltip placement="top" contained>
          <ThemedText.Caption>{tooltip}</ThemedText.Caption>
        </Tooltip>
      )}
    </Row>
  )
}
