import React from 'react'
import ReactGA from 'react-ga'
import styled from 'styled-components'
import { darken, transparentize } from 'polished'
import Toggle from 'react-switch'

import { Link } from '../../theme'
import { ButtonSecondary } from '../Button'
import { useDarkModeManager } from '../../contexts/LocalStorage'
import { useWeb3React } from '../../hooks'
import { useUserAdvanced, useToggleUserAdvanced } from '../../contexts/Application'
import { Eye, EyeOff, Send } from 'react-feather'

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

const StyledToggle = styled(Toggle)`
  margin-right: 24px;

  .react-switch-bg[style] {
    background-color: ${({ theme }) => darken(0.05, theme.bg1)} !important;
    border: 1px solid ${({ theme }) => theme.bg1} !important;
  }

  .react-switch-handle[style] {
    background-color: ${({ theme }) => theme.bg1};
    box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.93, theme.shadow1)};
    border: 1px solid ${({ theme }) => theme.bg3};
    border-color: ${({ theme }) => theme.bg3} !important;
    top: 2px !important;
  }
`

const EmojiToggle = styled.span`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-family: Arial sans-serif;
`

export default function Footer() {
  const [isDark, toggleDarkMode] = useDarkModeManager()
  const { account, chainId } = useWeb3React()
  const toggleAdvanced = useToggleUserAdvanced()
  const advanced = useUserAdvanced()

  return (
    <FooterFrame>
      {account && (
        <ButtonSecondary
          style={{ padding: '6px 8px', marginRight: '8px', width: 'fit-content' }}
          onClick={toggleAdvanced}
        >
          <Eye size={16} style={{ marginRight: '8px' }} /> Expert view
        </ButtonSecondary>
      )}
      <ButtonSecondary
        style={{
          padding: ' 8px 12px',
          marginRight: '0px',
          width: 'fit-content'
        }}
      >
        <Send size={16} style={{ marginRight: '8px' }} /> Feedback
      </ButtonSecondary>
      {/* <FooterElement>
        <Title>
          <Link id="link" href="https://uniswap.io/">
            <h1 id="title">About</h1>
          </Link>
          <Link id="link" href="https://docs.uniswap.io/">
            <h1 id="title">Docs</h1>
          </Link>
          <Link id="link" href="https://github.com/Uniswap">
            <h1 id="title">Code</h1>
          </Link>
        </Title>
      </FooterElement>

      <StyledToggle
        checked={!isDark}
        uncheckedIcon={
          <EmojiToggle role="img" aria-label="moon">
            🌙️
          </EmojiToggle>
        }
        checkedIcon={
          <EmojiToggle role="img" aria-label="sun">
            {'☀️'}
          </EmojiToggle>
        }
        onChange={() => {
          ReactGA.event({
            category: 'Advanced Interaction',
            action: 'Toggle Theme',
            label: isDark ? 'Light' : 'Dark'
          })
          toggleDarkMode()
        }}
      /> */}
    </FooterFrame>
  )
}
