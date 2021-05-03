import React from 'react'
import styled from 'styled-components'
import { TYPE } from 'theme'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from '../../theme'

const CTASection = styled.section`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 8px;
`

const CTA1 = styled(ExternalLink)`
  background-color: ${({ theme }) => theme.bg1};
  padding: 32px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 220px;
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
`

export default function CTACards() {
  const { t } = useTranslation()

  return (
    <CTASection>
      <CTA1 href={''}>
        <span>
          <TYPE.largeHeader fontWeight={400} style={{ alignItems: 'center', display: 'flex', marginBottom: '24px' }}>
            {t('What’s new in V3 Liquidity Pools?')}
          </TYPE.largeHeader>
          <TYPE.body fontWeight={300} style={{ alignItems: 'center', display: 'flex' }}>
            {t(
              'Learn all about concentrated liquidity and get informed about how to choose ranges that make sense for you.'
            )}
          </TYPE.body>
        </span>
        <TYPE.largeHeader fontWeight={400} style={{ alignItems: 'center', display: 'flex' }}>
          {t('↗')}
        </TYPE.largeHeader>
      </CTA1>
      <CTA1 href={''}>
        <span>
          <TYPE.largeHeader fontWeight={400} style={{ alignItems: 'center', display: 'flex', marginBottom: '24px' }}>
            {t('Top pools')}
          </TYPE.largeHeader>
          <TYPE.body fontWeight={300} style={{ alignItems: 'center', display: 'flex' }}>
            {t('Explore the top pools with Uniswap Analytics.')}
          </TYPE.body>
        </span>
        <TYPE.largeHeader fontWeight={400} style={{ alignItems: 'center', display: 'flex' }}>
          {t('↗')}
        </TYPE.largeHeader>
      </CTA1>
    </CTASection>
  )
}
