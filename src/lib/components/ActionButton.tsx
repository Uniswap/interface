import { AlertTriangle, Icon, LargeIcon } from 'lib/icons'
import styled, { Color, css, keyframes, ThemedText } from 'lib/theme'
import { ReactNode, useMemo } from 'react'

import Button from './Button'
import Row from './Row'

const StyledButton = styled(Button)`
  border-radius: ${({ theme }) => theme.borderRadius * 0.75}em;
  flex-grow: 1;
  transition: background-color 0.25s ease-out, border-radius 0.25s ease-out, flex-grow 0.25s ease-out;

  :disabled {
    margin: -1px;
  }
`

const ActionRow = styled(Row)``

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

const actionCss = css`
  border: 1px solid ${({ theme }) => theme.outline};
  padding: calc(0.25em - 1px);
  padding-left: calc(0.75em - 1px);

  ${ActionRow} {
    animation: ${grow} 0.25s ease-in;
    flex-grow: 1;
    justify-content: flex-start;
    white-space: nowrap;
  }

  ${StyledButton} {
    border-radius: ${({ theme }) => theme.borderRadius}em;
    flex-grow: 0;
    padding: 1em;
  }
`

export const Overlay = styled(Row)<{ hasAction: boolean }>`
  border-radius: ${({ theme }) => theme.borderRadius}em;
  flex-direction: row-reverse;
  min-height: 3.5em;
  transition: padding 0.25s ease-out;

  ${({ hasAction }) => hasAction && actionCss}
`

export interface Action {
  message: ReactNode
  icon?: Icon
  onClick?: () => void
  children?: ReactNode
}

export interface BaseProps {
  color?: Color
  action?: Action
}

export type ActionButtonProps = BaseProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps>

export default function ActionButton({ color = 'accent', disabled, action, onClick, children }: ActionButtonProps) {
  const textColor = useMemo(() => (color === 'accent' && !disabled ? 'onAccent' : 'currentColor'), [color, disabled])
  return (
    <Overlay hasAction={Boolean(action)} flex align="stretch">
      {(action ? action.onClick : true) && (
        <StyledButton color={color} disabled={disabled} onClick={action?.onClick || onClick}>
          <ThemedText.TransitionButton buttonSize={action ? 'medium' : 'large'} color={textColor}>
            {action?.children || children}
          </ThemedText.TransitionButton>
        </StyledButton>
      )}
      {action && (
        <ActionRow gap={0.5}>
          <LargeIcon color="currentColor" icon={action.icon || AlertTriangle} />
          <ThemedText.Subhead2>{action?.message}</ThemedText.Subhead2>
        </ActionRow>
      )}
    </Overlay>
  )
}
