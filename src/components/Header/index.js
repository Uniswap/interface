import React from 'react'
import styled from 'styled-components'

import { Link } from '../../theme'
import Web3Status from '../Web3Status'
import { darken } from 'polished'
import { useDarkModeManager } from '../../contexts/LocalStorage'

import Logo from '../../assets/images/logo.svg'
import Wordmark from '../../assets/images/wordmark.svg'
import LogoDark from '../../assets/images/logo_white.svg'
import WordmarkDark from '../../assets/images/wordmark_white.svg'

const HeaderFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const HeaderElement = styled.div`
  margin: 1.25rem;
  display: flex;
  min-width: 0;
  display: flex;
  align-items: center;
`

const UniIcon = styled(Link)`
  transition: transform 0.3s ease;
  :hover {
    transform: rotate(-5deg);
  }
`

const Title = styled.div`
  display: flex;
  align-items: center;

  :hover {
    cursor: pointer;
  }

  #link {
    text-decoration-color: ${({ theme }) => theme.colors.pink1};
  }

  #title {
    display: inline;
    font-size: 1rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.pink1};
    :hover {
      color: ${({ theme }) => darken(0.1, theme.colors.pink1)};
    }
  }
`

export default function Header() {
  const [isDark] = useDarkModeManager()

  return (
    <HeaderFrame>
      <HeaderElement>
        <Title>
          <UniIcon id="link">
            <img src={isDark ? LogoDark : Logo} alt="logo" />
          </UniIcon>
          <img style={{ marginLeft: '4px', marginTop: '0px' }} src={isDark ? WordmarkDark : Wordmark} alt="logo" />
        </Title>
      </HeaderElement>
      <HeaderElement>
        <Web3Status />
      </HeaderElement>
    </HeaderFrame>
  )
}
