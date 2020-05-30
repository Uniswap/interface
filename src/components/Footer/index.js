import React from 'react'
import styled from 'styled-components'

import { Link } from '../../theme'

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
    color: #ffffff;
    :hover {
      color: #e0e0e0;
    }
  }
`

export default function Footer() {
  return (
    <FooterFrame>
      <FooterElement>
        <Title>
          <Link id="link" href="https://defimoneymarket.com/">
            <h1 id="title">About</h1>
          </Link>
          <Link id="link" href="https://github.com/defi-money-market-ecosystem/protocol#dmm-protocol">
            <h1 id="title">Docs</h1>
          </Link>
          <Link id="link" href="https://github.com/defi-money-market-ecosystem">
            <h1 id="title">Code</h1>
          </Link>
        </Title>
      </FooterElement>
    </FooterFrame>
  )
}
