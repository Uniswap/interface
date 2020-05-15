import React from 'react'
import styled from 'styled-components'
import { Send, Sun, Moon } from 'react-feather'
import { useDarkModeManager } from '../../state/user/hooks'

import { ButtonSecondary } from '../Button'

const FooterFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

export default function Footer() {
  const [darkMode, toggleDarkMode] = useDarkModeManager()

  return (
    <FooterFrame>
      <form action="https://forms.gle/DaLuqvJsVhVaAM3J9" target="_blank">
        <ButtonSecondary p="8px 12px">
          <Send size={16} style={{ marginRight: '8px' }} /> Feedback
        </ButtonSecondary>
      </form>
      <ButtonSecondary onClick={toggleDarkMode} p="8px 12px" ml="0.5rem" width="min-content">
        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
      </ButtonSecondary>
    </FooterFrame>
  )
}
