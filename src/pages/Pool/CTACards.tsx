import React from 'react'
import styled from 'styled-components'
import { TYPE } from 'theme'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from '../../theme'
import { AutoColumn } from 'components/Column'
import Squiggle from '../../assets/images/squiggle.png'
import Texture from '../../assets/images/sandtexture.png'
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
  background-image: linear-gradient(to right, #2d2d2d 1px, transparent 1px),
    linear-gradient(to bottom, #2d2d2d 1px, transparent 1px);
  background-color: ${({ theme }) => theme.bg1};
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
  gap: 12px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    gap: 8px;
  `};
`

const StyledImage = styled.img`
  margin-top: -28px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    height: 80px;
    padding-right: 1rem;
  `};
`

export default function CTACards() {
  const { t } = useTranslation()

  return (
    <CTASection>
      <CTA1 href={''}>
        <ResponsiveColumn>
          <HeaderText>{t('What’s new in V3 Liquidity Pools?')}</HeaderText>
          <TYPE.body fontWeight={300} style={{ alignItems: 'center', display: 'flex', maxWidth: '80%' }}>
            {t(
              'Learn all about concentrated liquidity and get informed about how to choose ranges that make sense for you.'
            )}
          </TYPE.body>
          <RowBetween align="flex-end">
            <HeaderText>{t('↗')}</HeaderText>
            <StyledImage src={Squiggle} />
          </RowBetween>
        </ResponsiveColumn>
      </CTA1>
      <CTA2 href={''}>
        {/* <TextureBG /> */}
        <ResponsiveColumn>
          <HeaderText>{t('Top pools')}</HeaderText>
          <TYPE.body fontWeight={300} style={{ alignItems: 'center', display: 'flex' }}>
            {t('Explore the top pools with Uniswap Analytics.')}
          </TYPE.body>
          <HeaderText>{t('↗')}</HeaderText>
        </ResponsiveColumn>
      </CTA2>
    </CTASection>
  )
}
