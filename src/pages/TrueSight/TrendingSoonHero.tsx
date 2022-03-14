import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'

import TrendingSoonHeroLaptop from 'assets/images/trending_soon_hero_laptop.png'
import TrendingSoonHeroTablet from 'assets/images/trending_soon_hero_tablet.png'
import TrendingSoonHeroMobile from 'assets/images/trending_soon_hero_mobile.png'
import useTheme from 'hooks/useTheme'

const Hero = styled.div`
  width: 100%;
  background-image: url(${TrendingSoonHeroLaptop});
  background-size: 100%;
  background-repeat: no-repeat;
  background-position: center;
  padding: 18px 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    background-image: url(${TrendingSoonHeroTablet});
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    background-image: url(${TrendingSoonHeroMobile});
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

  ${({ theme }) => theme.mediaWidth.upToLarge`
    max-width: 70ch;
  `}

  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 60ch;
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 14px;
    line-height: 20px;
  `}
`

const SubContent = styled.div`
  color: ${({ theme }) => theme.subText};
  font-weight: 400;
  font-size: 10px;
  line-height: 12px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 8px;
    line-height: 9.38px;
  `}
`

const TrendingSoonHero = () => {
  const theme = useTheme()

  return (
    <Hero>
      <MainContent>
        <Trans>
          Our <span style={{ color: theme.primary }}>TrueSight</span> technology analyzes on-chain data, trading volumes
          and price trendlines to discover tokens that could be trending in the near future
        </Trans>
      </MainContent>
      <SubContent>
        <Trans>Disclaimer: The information here should not be treated as any form of financial advise</Trans>
      </SubContent>
    </Hero>
  )
}

export default TrendingSoonHero
