import { Trans } from '@lingui/macro'
import styled, { Color, icon, keyframes, Theme } from 'lib/theme'
import Layer from 'lib/theme/layer'
import TYPE from 'lib/theme/type'
import { transparentize } from 'polished'
import { ReactNode, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'

import Button from './Button'
import Column from './Column'
import Row from './Row'

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

const StyledButton = styled(Button)<{ color?: Color; theme: Theme }>`
  :enabled {
    background-color: ${({ color = 'accent', theme }) => theme[color]};
  }

  :enabled:hover {
    background-color: ${({ color = 'accent', theme }) => transparentize(0.3, theme[color])};
    opacity: 1;
  }
`

const StyledActionButton = styled(StyledButton)`
  border-radius: ${({ theme }) => theme.borderRadius}em;
  height: 3.5em;

  :disabled {
    opacity: 1;
  }
`

const StyledDisabledButton = styled(StyledActionButton)`
  border: 1px solid ${({ theme }) => theme.outline};
`

export function DisabledButton({ children }: { children: ReactNode }) {
  return (
    <Overlay>
      <StyledDisabledButton disabled>
        <TYPE.buttonLarge>{children}</TYPE.buttonLarge>
      </StyledDisabledButton>
    </Overlay>
  )
}

const rotate = ({ width, height }: { width?: number; height?: number }) => {
  if (!width || !height) {
    return undefined
  }

  const mid = (height / (width + height)) * 50
  const tan = width / height
  const deg = (Math.atan(tan) * 180) / Math.PI

  return keyframes`
  @property --start {
    syntax: '<angle>';
    inherits: false;
    initial-value: ${deg}deg;
  }
  0% {
    --start: ${90}deg;
  }
  ${mid}% {
    --start: ${180 - deg}deg;
  }
  ${50 - mid}% {
    --start: ${180 + deg}deg;
  }
  ${50 + mid}% {
    --start: ${360 - deg}deg;
  }
  ${100 - mid}% {
    --start: ${360 + deg}deg;
  }
  100% {
    --start: ${360 + 90}deg;
  }
`
}

const StyledLoadingButton = styled(StyledActionButton)<{ width?: number; height?: number; theme: Theme }>`
  background: inherit;
  overflow: hidden;
  position: relative;
  z-index: 1;

  :before,
  :after {
    content: '';
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: -1;
  }

  :before {
    animation: 2s ${rotate} ease infinite;
    background: ${({ theme }) => theme.outline}; // fallback

    @supports (--foo: 0) {
      background: conic-gradient(
        from var(--start, 75deg),
        transparent,
        ${({ theme }) => theme.outline} 45deg 315deg,
        transparent
      );
    }
  }

  :after {
    background: inherit;
    clip-path: inset(1px round ${({ theme }) => theme.borderRadius}em);
  }
`

export function LoadingButton() {
  const [ref, setRef] = useState<HTMLButtonElement | null>(null)
  const rect = useMemo(() => {
    const rect = ref?.getBoundingClientRect()
    return rect && { width: rect.width, height: rect.height }
  }, [ref])
  return (
    <Overlay>
      <StyledLoadingButton ref={setRef} {...rect} disabled>
        <TYPE.buttonLarge>
          <Trans>Loading…</Trans>
        </TYPE.buttonLarge>
      </StyledLoadingButton>
    </Overlay>
  )
}

export interface ActionButtonProps {
  color?: Color
  onClick: () => void
  children: ReactNode
}

const AlertIcon = icon(AlertTriangle, { color: 'primary' })

const ApprovalRow = styled(Row)`
  background-color: inherit;
  border: 1px solid ${({ theme }) => theme.outline};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  height: 3.5em;
  padding: 0.5em;
`

const StyledApprovalButton = styled(StyledButton)`
  border-radius: ${({ theme }) => theme.borderRadius}em;
  color: ${({ theme }) => theme.contrast};
  height: 100%;
  padding: 0 1em;
`

export function ApprovalButton({ color, onClick, children }: ActionButtonProps) {
  return (
    <Overlay>
      <ApprovalRow>
        <Row gap={0.5}>
          <AlertIcon />
          <TYPE.subhead2>{children}</TYPE.subhead2>
        </Row>
        <StyledApprovalButton color={color} onClick={onClick}>
          <Trans>Approve</Trans>
        </StyledApprovalButton>
      </ApprovalRow>
    </Overlay>
  )
}

export default function ActionButton({ color, onClick, children }: ActionButtonProps) {
  return (
    <Overlay>
      <StyledActionButton color={color} onClick={onClick}>
        <TYPE.buttonLarge color="contrast">{children}</TYPE.buttonLarge>
      </StyledActionButton>
    </Overlay>
  )
}
