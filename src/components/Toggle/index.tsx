import React from 'react'
import styled from 'styled-components'

const ToggleElement = styled.span<{ isActive?: boolean; on?: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 14px;
  background: ${({ theme, isActive, on }) => (isActive ? (on ? theme.primary1 : theme.text5) : 'none')};
  color: ${({ theme, isActive, on }) => (isActive ? (on ? theme.white : theme.text2) : theme.text3)};
  font-size: 0.825rem;
  font-weight: 400;
  /* :hover {
    user-select: ${({ isActive }) => (isActive ? 'none' : 'initial')};
    background: ${({ theme, isActive }) => (isActive ? theme.primary1 : 'none')};
    color: ${({ theme, isActive }) => (isActive ? theme.white : theme.primary3)};
  } */
`

const StyledToggle = styled.a<{ isActive?: boolean; activeElement?: boolean }>`
  border-radius: 16px;
  border: 1px solid ${({ theme, isActive }) => (isActive ? theme.primary5 : theme.text5)};
  display: flex;
  width: fit-content;
  cursor: pointer;
  text-decoration: none;
  :hover {
    text-decoration: none;
  }
`

export interface ToggleProps {
  isActive: boolean
  toggle: () => void
}

export default function Toggle({ isActive, toggle }: ToggleProps) {
  return (
    <StyledToggle isActive={isActive} target="_self" onClick={toggle}>
      <ToggleElement isActive={isActive} on={true}>
        On
      </ToggleElement>
      <ToggleElement isActive={!isActive} on={false}>
        Off
      </ToggleElement>
    </StyledToggle>
  )
}
