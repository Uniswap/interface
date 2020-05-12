import React from 'react'
import styled from 'styled-components'
import { Send, Sun, Moon } from 'react-feather'
import { useDarkModeManager } from '../../state/user/hooks'

import { ButtonSecondary } from '../Button'

const FooterFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
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
      <form action="https://forms.gle/DaLuqvJsVhVaAM3J9">
        <ButtonSecondary
          style={{
            padding: ' 8px 12px',
            marginRight: '8px',
            width: 'fit-content'
          }}
        >
          <Send size={16} style={{ marginRight: '8px' }} /> Feedback
        </ButtonSecondary>
      </form>
      <ButtonSecondary
        onClick={toggleDarkMode}
        style={{
          padding: ' 8px 12px',
          marginRight: '0px',
          width: 'fit-content'
        }}
      >
        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
      </ButtonSecondary>
    </FooterFrame>
  )
}
