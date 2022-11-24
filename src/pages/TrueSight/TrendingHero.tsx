import { Trans } from '@lingui/macro'
import styled from 'styled-components'

import TrendingHeroLight from 'assets/images/trending-light.png'
import TrendingHeroImg from 'assets/images/trending.png'
import { useIsDarkMode } from 'state/user/hooks'

const Hero = styled.div<{ darkMode?: boolean }>`
  width: 100%;
  padding: 24px 0;
  border-top: 1px solid ${({ theme }) => theme.border};
  border-bottom: 1px solid ${({ theme }) => theme.border};

  background-image: ${({ darkMode }) => (darkMode ? `url(${TrendingHeroImg})` : `url(${TrendingHeroLight})`)};
  background-size: contain;
  background-repeat: no-repeat;
  background-position: right;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    background-image: none;
    padding: 16px 0;
  `}
`

const MainContent = styled.div`
  color: ${({ theme }) => theme.subText};
  font-weight: 400;
  font-size: 12px;
  max-width: 70ch;
`

const TrendingHero = () => {
  const darkMode = useIsDarkMode()
  return (
    <Hero darkMode={darkMode}>
      <MainContent>
        <Trans>Here you can view tokens that are currently trending on Coingecko and Coinmarketcap</Trans>
      </MainContent>
    </Hero>
  )
}

export default TrendingHero
