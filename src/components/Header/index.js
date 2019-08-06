import React from 'react'
import styled from 'styled-components'

import { Link } from '../../theme'
import Web3Status from '../Web3Status'
import { darken } from 'polished'
import { useDarkModeManager } from '../../contexts/LocalStorage'

const HeaderElement = styled.div`
  margin: 1.25rem;
  display: flex;
  min-width: 0;
`

const Title = styled.div`
  display: flex;
  align-items: center;

  :hover {
    cursor: pointer;
  }

  #image {
    font-size: 1.5rem;
    margin-right: 1rem;
    transform: rotate(0deg);
    transition: transform 150ms ease-out;

    :hover {
      transform: rotate(-10deg);
    }
  }

  #link {
    text-decoration-color: ${({ theme }) => theme.wisteriaPurple};
  }

  #title {
    display: inline;
    font-size: 1rem;
    font-weight: 500;
    color: ${({ theme }) => theme.wisteriaPurple};
    :hover {
      color: ${({ theme }) => darken(0.2, theme.wisteriaPurple)};
    }
  }
`

export default function Header() {
  const [, toggleDarkMode] = useDarkModeManager()

  return (
    <>
      <HeaderElement>
        <Title>
          <span onClick={toggleDarkMode} id="image" role="img" aria-label="Unicorn Emoji">
            🦄
          </span>

          <Link id="link" href="https://uniswap.io">
            <h1 id="title">Uniswap</h1>
          </Link>
        </Title>
      </HeaderElement>

      <HeaderElement>
        <Web3Status />
      </HeaderElement>
    </>
  )
}
