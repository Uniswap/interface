import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'

import TrendingHeroLaptop from 'assets/images/trending_hero_laptop.png'
import TrendingHeroTablet from 'assets/images/trending_hero_tablet.png'
import TrendingHeroMobile from 'assets/images/trending_hero_mobile.png'

const Hero = styled.div`
  width: 100%;
  background-image: url(${TrendingHeroLaptop});
  background-size: 100%;
  background-repeat: no-repeat;
  background-position: center;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-radius: 8px;
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    background-image: url(${TrendingHeroTablet});
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    background-image: url(${TrendingHeroMobile});
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 16px;
  `}
`

const MainContent = styled.div`
  color: ${({ theme }) => theme.white};
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  max-width: 70ch;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 14px;
    line-height: 20px;
  `}
`

const TrendingHero = () => {
  return (
    <Hero>
      <MainContent>
        <Trans>
          Here you can view tokens that are currently trending in <span style={{ fontWeight: 500 }}>Coingecko</span> and{' '}
          <span style={{ fontWeight: 500 }}>Coinmarketcap</span>
        </Trans>
      </MainContent>
    </Hero>
  )
}

export default TrendingHero
