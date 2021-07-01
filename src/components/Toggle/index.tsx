import { Trans } from '@lingui/macro'
import { darken } from 'polished'
import { ReactNode } from 'react'
import styled from 'styled-components/macro'

const ToggleElement = styled.span<{ isActive?: boolean; isOnSwitch?: boolean }>`
  padding: 0.25rem 0.6rem;
  border-radius: 9px;
  background: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.primary1 : theme.bg4) : 'none')};
  color: ${({ theme, isActive }) => (isActive ? theme.white : theme.text2)};
  font-size: 1rem;
  font-weight: ${({ isOnSwitch }) => (isOnSwitch ? '500' : '400')};
  :hover {
    user-select: ${({ isOnSwitch }) => (isOnSwitch ? 'none' : 'initial')};
    background: ${({ theme, isActive, isOnSwitch }) =>
      isActive ? (isOnSwitch ? darken(0.05, theme.primary1) : darken(0.05, theme.bg4)) : 'none'};
    color: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.white : theme.white) : theme.text3)};
  }
`

const StyledToggle = styled.button<{ isActive?: boolean; activeElement?: boolean }>`
  border-radius: 12px;
  border: 2px solid;
  border-color: ${({ theme, isActive }) => (isActive ? theme.primary1 : theme.bg3)};
  background: ${({ theme }) => theme.bg1};
  display: flex;
  width: fit-content;
  cursor: pointer;
  outline: none;
  padding: 2px;
`

export interface ToggleProps {
  id?: string
  isActive: boolean
  toggle: () => void
  checked?: ReactNode
  unchecked?: ReactNode
}

export default function Toggle({
  id,
  isActive,
  toggle,
  checked = <Trans>On</Trans>,
  unchecked = <Trans>Off</Trans>,
}: ToggleProps) {
  return (
    <StyledToggle id={id} isActive={isActive} onClick={toggle}>
      <ToggleElement isActive={isActive} isOnSwitch={true}>
        {checked}
      </ToggleElement>
      <ToggleElement isActive={!isActive} isOnSwitch={false}>
        {unchecked}
      </ToggleElement>
    </StyledToggle>
  )
}
