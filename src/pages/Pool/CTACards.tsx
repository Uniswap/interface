import React from 'react'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { Trans } from '@lingui/macro'
import { ExternalLink } from '../../theme'
import { AutoColumn } from 'components/Column'
import Squiggle from '../../assets/images/squiggle.png'
import Texture from '../../assets/images/sandtexture.webp'
import { RowBetween } from 'components/Row'

const CTASection = styled.section`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: auto;
    grid-template-rows: auto;
  `};
`

const CTA1 = styled(ExternalLink)`
  background-size: 40px 40px;
  background-image: linear-gradient(to right, ${({ theme }) => theme.bg3} 1px, transparent 1px),
    linear-gradient(to bottom, ${({ theme }) => theme.bg3} 1px, transparent 1px);
  background-color: ${({ theme }) => theme.bg2};
  padding: 32px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  position: relative;
  justify-content: space-between;
  border: 1px solid ${({ theme }) => theme.bg3};

  * {
    color: ${({ theme }) => theme.text1};
    text-decoration: none !important;
  }

  :hover {
    border: 1px solid ${({ theme }) => theme.bg5};
    background-color: ${({ theme }) => theme.bg2};
    text-decoration: none;
    * {
      text-decoration: none !important;
    }
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
   padding: 1rem;
  `};
`

const CTA2 = styled(ExternalLink)`
  position: relative;
  overflow: hidden;
  padding: 32px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid ${({ theme }) => theme.bg4};

  * {
    color: ${({ theme }) => theme.text1};
    text-decoration: none !important;
  }

  :hover {
    border: 1px solid ${({ theme }) => theme.bg5};
    opacity: 0.7;
    text-decoration: none !important;
    * {
      text-decoration: none !important;
    }
  }

  :before {
    content: '';
    position: absolute;
    width: 340%;
    height: 280%;
    top: -130%;
    left: -134%;
    z-index: -1;
    background: url(${Texture}) 0 0 repeat;
    transform: rotate(-4deg);
  }
`

const HeaderText = styled(TYPE.label)`
  align-items: center;
  display: flex;
  margin-bottom: 24px;
  font-weight: 400;
  font-size: 20px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size: 20px;
  `};
`

const ResponsiveColumn = styled(AutoColumn)`
  grid-template-columns: 1fr;
  gap: 12px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    gap: 8px;
  `};
  justify-content: space-between;
`

const StyledImage = styled.img`
  height: 114px;
  margin-top: -28px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    height: 80px;
    padding-right: 1rem;
  `};
`

export default function CTACards() {
  return (
    <CTASection>
      <CTA1 href={'https://docs.uniswap.org/concepts/introduction/liquidity-user-guide'}>
        <ResponsiveColumn>
          <HeaderText>
            <Trans>Uniswap V3 is here!</Trans>
          </HeaderText>
          <TYPE.body fontWeight={300} style={{ alignItems: 'center', display: 'flex', maxWidth: '80%' }}>
            <Trans>Check out our v3 LP walkthrough and migration guides.</Trans>
          </TYPE.body>
          <RowBetween align="flex-end">
            <HeaderText>↗</HeaderText>
            <StyledImage src={Squiggle} />
          </RowBetween>
        </ResponsiveColumn>
      </CTA1>
      <CTA2 href={'https://info.uniswap.org/#/pools'}>
        <ResponsiveColumn>
          <HeaderText style={{ alignSelf: 'flex-start' }}>
            <Trans>Top pools</Trans>
          </HeaderText>
          <TYPE.body fontWeight={300} style={{ alignSelf: 'flex-start' }}>
            <Trans>Explore popular pools on Uniswap Analytics.</Trans>
          </TYPE.body>
          <HeaderText style={{ alignSelf: 'flex-end' }}>↗</HeaderText>
        </ResponsiveColumn>
      </CTA2>
    </CTASection>
  )
}
