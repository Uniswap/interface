import styled, { Color, icon, Layer, ThemedText } from 'lib/theme'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'

import Button from './Button'
import Column from './Column'
import Row from './Row'

// TODO(zzmp):
// - disabled
// - interactive color
// - 0.2s transition to "approve"

export const Overlay = styled(Column)`
  border-radius: ${({ theme }) => theme.borderRadius}em;
  bottom: 0;
  position: sticky;
  z-index: ${Layer.OVERLAY};

  :before {
    background-color: inherit;
    border-radius: ${({ theme }) => theme.borderRadius}em ${({ theme }) => theme.borderRadius}em 0 0;
    content: '';
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: -1;
  }
`

const StyledActionButton = styled(Button)`
  border-radius: ${({ theme }) => theme.borderRadius}em;
  height: 3.5em;
`

const AlertIcon = icon(AlertTriangle, { color: 'primary' })

const ApprovalRow = styled(Row)`
  background-color: inherit;
  border: 1px solid ${({ theme }) => theme.outline};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  height: 3.5em;
  padding: 0.5em;
`

const StyledApprovalButton = styled(Button)`
  border-radius: ${({ theme }) => theme.borderRadius}em;
  height: 100%;
  padding: 0 1em;
`

interface ApprovalButtonProps {
  color: Color
  message: ReactNode
  action: ReactNode
  onClick: () => void
}

export function ApprovalButton({ color, message, action, onClick }: ApprovalButtonProps) {
  return (
    <Overlay>
      <ApprovalRow>
        <Row gap={0.5}>
          <AlertIcon />
          <ThemedText.Subhead2>{message}</ThemedText.Subhead2>
        </Row>
        <StyledApprovalButton onClick={onClick}>{action}</StyledApprovalButton>
      </ApprovalRow>
    </Overlay>
  )
}

export interface ActionButtonProps {
  color?: Color
  disabled?: boolean
  updated?: { message: ReactNode; action: ReactNode }
  onClick: () => void
  onUpdate: () => void
  children: ReactNode
}

export default function ActionButton({
  color = 'accent',
  disabled,
  updated,
  onClick,
  onUpdate,
  children,
}: ActionButtonProps) {
  return (
    <Overlay>
      {updated ? (
        <ApprovalButton color={color} onClick={onUpdate} {...updated} />
      ) : (
        <StyledActionButton color={color} disabled={disabled} onClick={onClick}>
          <ThemedText.ButtonLarge color="onInteractive">{children}</ThemedText.ButtonLarge>
        </StyledActionButton>
      )}
    </Overlay>
  )
}
