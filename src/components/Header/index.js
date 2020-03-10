import React from 'react'
import styled from 'styled-components'

import Web3Status from '../Web3Status'
import { Link } from '../../theme'

import Logo from '../../assets/svg/logo.svg'

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

const Title = styled.div`
  display: flex;
  align-items: center;

  :hover {
    cursor: pointer;
  }
`

const TitleText = styled.div`
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(119.64deg, #fb1868 -5.55%, #ff00f3 154.46%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-left: 12px;
`

export default function Header() {
  return (
    <HeaderFrame>
      <HeaderElement>
        <Title>
          <Link id="link" href="https://uniswap.io">
            <img src={Logo} />
          </Link>
          <Link id="link" href="https://uniswap.io">
            <TitleText>Uniswap</TitleText>
          </Link>
        </Title>
      </HeaderElement>
      <HeaderElement>
        <Web3Status />
      </HeaderElement>
    </HeaderFrame>
  )
}
