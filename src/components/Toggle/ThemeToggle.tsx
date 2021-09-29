import React from 'react'
import styled from 'styled-components'

import DarkModeIconActive from 'components/Icons/DarkModeIconActive'
import DarkModeIconInactive from 'components/Icons/DarkModeIconInactive'
import LightModeIconActive from 'components/Icons/LightModeIconActive'
import LightModeIconInactive from 'components/Icons/LightModeIconInactive'

const ToggleElement = styled.span<{ isDarkMode?: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 50%;
  background: ${({ theme, isDarkMode }) => (isDarkMode ? theme.primary1 : 'none')};
  font-size: 1rem;
  font-weight: 400;
`

const StyledToggle = styled.button`
  border-radius: 16px;
  border: none;
  background: ${({ theme }) => theme.bg3};
  display: flex;
  width: fit-content;
  cursor: pointer;
  outline: none;
  padding: 0;
  opacity: 1;
  transition: opacity 0.25s ease;

  :hover {
    opacity: 0.9;
  }
`

export interface ThemeToggleProps {
  id?: string
  isDarkMode: boolean
  toggle: () => void
}

export default function ThemeToggle({ id, isDarkMode, toggle }: ThemeToggleProps) {
  return (
    <StyledToggle id={id} onClick={toggle}>
      <ToggleElement isDarkMode={!isDarkMode}>
        {isDarkMode ? <LightModeIconInactive /> : <LightModeIconActive />}
      </ToggleElement>
      <ToggleElement isDarkMode={isDarkMode}>
        {isDarkMode ? <DarkModeIconActive /> : <DarkModeIconInactive />}
      </ToggleElement>
    </StyledToggle>
  )
}
