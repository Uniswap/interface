import styled, { Color, icon, Theme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'

import Button from './Button'
import Row from './Row'

export const ActionButton = styled(Button)<{ color?: Color; theme: Theme }>`
  background-color: ${({ color, theme }) => color && theme[color]};
  border-radius: ${({ theme }) => theme.borderRadius * 0.5}em;
  height: 3.5em;
  outline: ${({ color, theme }) => (color ? undefined : `1px solid ${theme.outline}`)};

  :disabled {
    opacity: 1;
  }
`

const ApprovalRow = styled(Row)`
  border-radius: ${({ theme }) => theme.borderRadius * 0.5}em;
  height: 3.5em;
  outline: 1px solid ${({ theme }) => theme.outline};
  padding: 0.5em;
`

const ApproveButton = styled(Button)`
  background-color: ${({ theme }) => theme.interactive};
  border-radius: ${({ theme }) => theme.borderRadius * 0.5}em;
  color: ${({ theme }) => theme.contrast};
  height: 100%;
  padding: 0 1em;
`

export function Disabled({ children }: { children: ReactNode }) {
  return (
    <ActionButton disabled>
      <TYPE.buttonLarge>{children}</TYPE.buttonLarge>
    </ActionButton>
  )
}

export function Loading() {
  return (
    <ActionButton disabled>
      <TYPE.buttonLarge>Loading…</TYPE.buttonLarge>
    </ActionButton>
  )
}

export interface ActionProps {
  onClick: () => void
  children: ReactNode
}

const AlertIcon = icon(AlertTriangle, { color: 'primary' })

export function Approval({ onClick, children }: ActionProps) {
  return (
    <ApprovalRow>
      <Row gap={0.5}>
        <AlertIcon />
        <TYPE.subhead2>{children}</TYPE.subhead2>
      </Row>
      <ApproveButton onClick={onClick}>Approve</ApproveButton>
    </ApprovalRow>
  )
  return null
}

export default function Action({ onClick, children }: ActionProps) {
  return (
    <ActionButton color="interactive" onClick={onClick}>
      <TYPE.buttonLarge color="contrast">{children}</TYPE.buttonLarge>
    </ActionButton>
  )
}
