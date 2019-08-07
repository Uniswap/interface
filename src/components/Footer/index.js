import React from 'react'
import styled from 'styled-components'

import { Link } from '../../theme'
import { darken } from 'polished'
import { useDarkModeManager } from '../../contexts/LocalStorage'
import Toggle from 'react-toggle'
import { transparentize } from 'polished'

import 'react-toggle/style.css'

const FooterFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const FooterElement = styled.div`
  margin: 1.25rem;
  display: flex;
  min-width: 0;
  display: flex;
  align-items: center;
`

const Title = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.uniswapPink};

  :hover {
    cursor: pointer;
  }
  #link {
    text-decoration-color: ${({ theme }) => theme.uniswapPink};
  }

  #title {
    display: inline;
    font-size: 0.825rem;
    margin-right: 12px;
    font-weight: 400;
    color: ${({ theme }) => theme.uniswapPink};
    :hover {
      color: ${({ theme }) => darken(0.2, theme.uniswapPink)};
    }
  }
`

const EmojiToggle = styled.span`
  position: relative;
  font-size: 15px;
  font-family: 'Arial sans-serif';
`

const ToggleComponent = styled(Toggle)`
  margin-right: 24px;
  .react-toggle-track {
    background-color: ${({ theme }) => theme.inputBackground} !important;
    border: 1px solid ${({ theme }) => theme.concreteGray};
  }

  .react-toggle-track-x {
    line-height: unset;
    bottom: auto;
    right: 14px;
  }

  .react-toggle-track-check {
    line-height: unset;
    bottom: auto;
    left: 7px;
  }

  &&& .react-toggle-thumb {
    background-color: ${({ theme }) => theme.inputBackground};
    box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.93, theme.royalBlue)};
    border: 1px solid ${({ theme }) => theme.mercuryGray};
    border-color: ${({ theme }) => theme.mercuryGray} !important;
    /* border: none; */
    top: 2px;
    left: ${({ defaultChecked }) => (defaultChecked ? '28px' : '2px')};
  }
`

function ToggleIcon(props) {
  return (
    <EmojiToggle role="img" aria-label="sun">
      {props.content}
    </EmojiToggle>
  )
}

export default function Footer() {
  const [isDark, toggleDarkMode] = useDarkModeManager()

  return (
    <FooterFrame>
      <FooterElement>
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
      <ToggleComponent
        defaultChecked={!isDark}
        icons={{ checked: <ToggleIcon content="☀️" />, unchecked: <ToggleIcon content="🌙️" /> }}
        onChange={toggleDarkMode}
      />
    </FooterFrame>
  )
}
