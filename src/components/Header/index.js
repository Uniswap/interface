import React from 'react'
import styled from 'styled-components'

import { Link } from '../../theme'
import Web3Status from '../Web3Status'
import { darken } from 'polished'

const HeaderFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  width: 100%;
  z-index: 2;
`

const HeaderSpan = styled.span`
  width: 100%;
  display: flex;
  justify-content: space-between;
`

const MigrateBanner = styled.div`
  width: 100%;
  padding: 12px 0;
  display: flex;
  justify-content: center;
  background-color: ${({ theme }) => theme.uniswapPink};
  color: ${({ theme }) => theme.inputBackground};
  font-weight: 400;
  text-align: center;
  a {
    color: ${({ theme }) => theme.inputBackground};
    text-decoration: underline;
  }
`

const MigrateBannerSmall = styled(MigrateBanner)`
  @media (min-width: 960px) {
    display: none;
  }
`

const MigrateBannerLarge = styled(MigrateBanner)`
  @media (max-width: 960px) {
    display: none;
  }
`

const HeaderElement = styled.div`
  margin: 1.25rem;
  display: flex;
  min-width: 0;
  align-items: center;
`

const Nod = styled.span`
  transform: rotate(0deg);
  transition: transform 150ms ease-out;
  margin-right: 4px;

  :hover {
    transform: rotate(-10deg);
  }
`

const Title = styled.div`
  display: flex;
  align-items: center;

  :hover {
    cursor: pointer;
  }

  #link {
    text-decoration-color: ${({ theme }) => theme.UniswapPink};
  }

  #title {
    display: inline;
    font-size: 1rem;
    font-weight: 500;
    color: ${({ theme }) => theme.wisteriaPurple};
    :hover {
      color: ${({ theme }) => darken(0.1, theme.wisteriaPurple)};
    }
  }
`

const TestnetWrapper = styled.div`
  white-space: nowrap;
  width: fit-content;
  margin-left: 10px;
`

const VersionLabel = styled.span`
  padding: ${({ isV1 }) => (isV1 ? '0.15rem 0.5rem 0.15rem 0.5rem' : '0.15rem 0.25rem 0.13rem 0.5rem')};
  border-radius: 14px;
  background: ${({ theme, isV1 }) => (isV1 ? theme.uniswapPink : 'none')};
  color: ${({ theme, isV1 }) => (isV1 ? theme.inputBackground : theme.uniswapPink)};
  font-size: 0.825rem;
  font-weight: 400;
`

const VersionToggle = styled.a`
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.uniswapPink};
  color: ${({ theme }) => theme.uniswapPink};
  display: flex;
  width: fit-content;
  cursor: pointer;
  text-decoration: none;
  :hover {
    text-decoration: none;
  }
`

export default function Header() {
  return (
    <HeaderFrame>
      <MigrateBannerSmall>
        <b>V2 is here!&nbsp;</b> <Link href="https://migrate.uniswap.exchange/">Migrate your liquidity&nbsp;</Link>or{' '}
        <Link href="https://uniswap.exchange"> &nbsp;use V2 ↗</Link>
      </MigrateBannerSmall>
      <MigrateBannerLarge>
        <b>Uniswap V2 is here!&nbsp;</b> Move your liquidity now using the&nbsp;
        <Link href="https://migrate.uniswap.exchange/">
          <b>migration helper</b>
        </Link>
        &nbsp;or use the&nbsp;
        <Link href="https://uniswap.exchange">
          <b>Uniswap V2 Interface ↗</b>
        </Link>
      </MigrateBannerLarge>
      <HeaderSpan>
        <HeaderElement>
          <Title>
            <Nod>
              <Link id="link" href="https://uniswap.io">
                <span role="img" aria-label="unicorn">
                  🦄{'  '}
                </span>
              </Link>
            </Nod>
            <Link id="link" href="https://uniswap.io">
              <h1 id="title">Uniswap</h1>
            </Link>
          </Title>
          <TestnetWrapper>
            <VersionToggle target="_self" href="https://v2.uniswap.exchange">
              <VersionLabel isV1={false}>V2</VersionLabel>
              <VersionLabel isV1={true}>V1</VersionLabel>
            </VersionToggle>
          </TestnetWrapper>
        </HeaderElement>
        <HeaderElement>
          <Web3Status />
        </HeaderElement>
      </HeaderSpan>
    </HeaderFrame>
  )
}
