import React from 'react'
import styled from 'styled-components'

import LightModeIconActive from 'components/Icons/LightModeIconActive'
import LightModeIconInactive from 'components/Icons/LightModeIconInactive'
import DarkModeIconActive from 'components/Icons/DarkModeIconActive'
import DarkModeIconInactive from 'components/Icons/DarkModeIconInactive'
import { useDarkModeManager } from 'state/user/hooks'

const StyledToggleDarkMode = styled.div`
  display: flex;
  align-items: center;
  padding: 6px 9px 6px 10px;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.bg13};

  :hover {
    cursor: pointer;
  }
`

const StyledLightModeIcon = styled.div`
  display: flex;
  align-items: center;
  padding-right: 6px;
  border-right: solid 0.6px #859aa5;
`

const StyledDarkModeIcon = styled.div`
  display: flex;
  align-items: center;
  padding-left: 6px;
`

export default function ToggleDarkMode() {
  const [darkMode, toggleDarkMode] = useDarkModeManager()

  return (
    <StyledToggleDarkMode onClick={toggleDarkMode}>
      <StyledLightModeIcon>{darkMode ? <LightModeIconInactive /> : <LightModeIconActive />}</StyledLightModeIcon>
      <StyledDarkModeIcon>{darkMode ? <DarkModeIconActive /> : <DarkModeIconInactive />}</StyledDarkModeIcon>
    </StyledToggleDarkMode>
  )
}
