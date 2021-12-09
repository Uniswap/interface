import styled, { Color, css, icon, keyframes, ThemedText } from 'lib/theme'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'

import Button from './Button'
import Row from './Row'

const StyledButton = styled(Button)<{ updated?: boolean }>`
  border-radius: ${({ theme }) => theme.borderRadius}em;
  flex-grow: 1;
  height: 100%;
  transition: background-color 0.2s ease-out, flex-grow 0.2s ease-out;
`

const UpdateRow = styled(Row)``

const grow = keyframes`
  from {
    opacity: 0;
    width: 0;
  }
  to {
    opacity: 1;
    width: max-content;
  }
`

const updatedCss = css`
  border: 1px solid ${({ theme }) => theme.outline};
  padding: calc(0.25em - 1px);
  padding-left: calc(0.75em - 1px);

  ${UpdateRow} {
    animation: ${grow} 0.2s ease-in;
    white-space: nowrap;
  }

  ${StyledButton} {
    border-radius: ${({ theme }) => theme.borderRadius * 0.75}em;
    flex-grow: 0;
    padding: 1em;
  }
`

export const Overlay = styled(Row)<{ updated?: boolean }>`
  border-radius: ${({ theme }) => theme.borderRadius}em;
  flex-direction: row-reverse;
  height: 3.5em;
  transition: padding 0.2s;

  ${({ updated }) => updated && updatedCss}
`

const AlertIcon = icon(AlertTriangle)

export interface ActionButtonProps {
  color?: Color
  disabled?: boolean
  updated?: { message: ReactNode; action: ReactNode }
  onClick: () => void
  onUpdate?: () => void
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
    <Overlay updated={Boolean(updated)} flex>
      <StyledButton color={color} disabled={disabled} onClick={updated ? onUpdate : onClick}>
        {updated ? (
          <ThemedText.ButtonMedium color="currentColor">{updated.action}</ThemedText.ButtonMedium>
        ) : (
          <ThemedText.ButtonLarge color="currentColor">{children}</ThemedText.ButtonLarge>
        )}
      </StyledButton>
      {updated && (
        <UpdateRow gap={0.5}>
          <AlertIcon />
          <ThemedText.Subhead2>{updated?.message}</ThemedText.Subhead2>
        </UpdateRow>
      )}
    </Overlay>
  )
}
