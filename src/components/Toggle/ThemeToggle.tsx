import React from 'react'
import styled from 'styled-components'

import DarkModeIconActive from 'components/Icons/DarkModeIconActive'
import DarkModeIconInactive from 'components/Icons/DarkModeIconInactive'
import LightModeIconActive from 'components/Icons/LightModeIconActive'
import LightModeIconInactive from 'components/Icons/LightModeIconInactive'

const ToggleElement = styled.span<{ isDarkMode?: boolean }>`
  border-radius: 50%;
  background-color: ${({ theme, isDarkMode }) => (isDarkMode ? theme.primary1 : 'none')};
  font-size: 1rem;
  font-weight: 400;
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const StyledToggle = styled.button`
  border-radius: 999px;
  border: none;
  background: ${({ theme }) => theme.bg3};
  display: flex;
  width: fit-content;
  cursor: pointer;
  outline: none;
  padding: 0;
  opacity: 1;
  width: 56px;
  height: 28px;
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
