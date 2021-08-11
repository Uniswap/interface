import { darken } from 'polished'
import { ReactNode } from 'react'
import styled from 'styled-components/macro'

const ToggleElement = styled.span<{ isActive?: boolean; isOnSwitch?: boolean }>`
  padding: 11px;
  border-radius: 50%;
  background: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.white : theme.white) : 'none')};
  :hover {
    user-select: ${({ isOnSwitch }) => (isOnSwitch ? 'none' : 'initial')};
    background: ${({ theme, isActive, isOnSwitch }) =>
      isActive ? (isOnSwitch ? darken(0.05, theme.white) : darken(0.05, theme.white)) : 'none'};
    opacity: 0.8;
  }
`

const StyledToggle = styled.button<{ isActive?: boolean; activeElement?: boolean }>`
  border-radius: 20px;
  border: none;
  background: ${({ theme, isActive }) => (isActive ? theme.blue1 : theme.bg3)};
  display: flex;
  cursor: pointer;
  outline: none;
  padding: 3px;

  :hover {
    opacity: 0.8;
  }
`

interface ToggleProps {
  id?: string
  isActive: boolean
  toggle: () => void
  checked?: ReactNode
  unchecked?: ReactNode
}

export default function AppleToggle({ id, isActive, toggle }: ToggleProps) {
  return (
    <StyledToggle id={id} isActive={isActive} onClick={toggle}>
      <ToggleElement isActive={!isActive} isOnSwitch={false}></ToggleElement>
      <ToggleElement isActive={isActive} isOnSwitch={true}></ToggleElement>
    </StyledToggle>
  )
}
