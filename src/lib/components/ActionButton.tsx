import styled, { Color, icon, keyframes, Theme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { ReactNode, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'

import Button from './Button'
import Row from './Row'

const BaseButton = styled(Button)`
  border-radius: ${({ theme }) => theme.borderRadius}em;
  height: 3.5em;

  :disabled {
    opacity: 1;
  }
`

const StyledDisabledButton = styled(BaseButton)`
  outline: 1px solid ${({ theme }) => theme.outline};
`

export function DisabledButton({ children }: { children: ReactNode }) {
  return (
    <StyledDisabledButton disabled>
      <TYPE.buttonLarge>{children}</TYPE.buttonLarge>
    </StyledDisabledButton>
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

const StyledLoadingButton = styled(BaseButton)<{ width?: number; height?: number; theme: Theme }>`
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
    background: conic-gradient(from var(--start), transparent, ${({ theme }) => theme.outline} 45deg);
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
    <StyledLoadingButton ref={setRef} {...rect} disabled>
      <TYPE.buttonLarge>Loading…</TYPE.buttonLarge>
    </StyledLoadingButton>
  )
}

export interface ActionButtonProps {
  color?: Color
  onClick: () => void
  children: ReactNode
}

const AlertIcon = icon(AlertTriangle, { color: 'primary' })

const ApprovalRow = styled(Row)`
  background-color: currentColor;
  border-radius: ${({ theme }) => theme.borderRadius}em;
  height: 3.5em;
  outline: 1px solid ${({ theme }) => theme.outline};
  padding: 0.5em;
`

const StyledApprovalButton = styled(Button)<{ color: Color; theme: Theme }>`
  background-color: ${({ color, theme }) => theme[color]};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  color: ${({ theme }) => theme.contrast};
  height: 100%;
  padding: 0 1em;
`

export function ApprovalButton({ color = 'accent', onClick, children }: ActionButtonProps) {
  return (
    <ApprovalRow>
      <Row gap={0.5}>
        <AlertIcon />
        <TYPE.subhead2>{children}</TYPE.subhead2>
      </Row>
      <StyledApprovalButton color={color} onClick={onClick}>
        Approve
      </StyledApprovalButton>
    </ApprovalRow>
  )
  return null
}

const StyledActionButton = styled(BaseButton)<{ color: Color; theme: Theme }>`
  background-color: ${({ color, theme }) => theme[color]};
`

export default function ActionButton({ color = 'accent', onClick, children }: ActionButtonProps) {
  return (
    <StyledActionButton color={color} onClick={onClick}>
      <TYPE.buttonLarge color="contrast">{children}</TYPE.buttonLarge>
    </StyledActionButton>
  )
}
