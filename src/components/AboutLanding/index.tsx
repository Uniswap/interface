import { Trans } from '@lingui/macro'
import { Trace, TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, ElementName, EventName, PageName } from '@uniswap/analytics-events'
import { BaseButton } from 'components/Button'
import Card, { CardType } from 'pages/About/Card'
import { MAIN_CARDS, MORE_CARDS } from 'pages/About/constants'
import ProtocolBanner from 'pages/About/ProtocolBanner'
import Swap from 'pages/Swap'
import { useRef } from 'react'
import { ArrowDownCircle } from 'react-feather'
import { useLocation } from 'react-router-dom'
import { Link as NativeLink } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

const PageContainer = styled.div<{ isDarkMode: boolean }>`
  position: absolute;
  top: 0;
  padding: ${({ theme }) => theme.navHeight}px 0px 0px 0px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  scroll-behavior: smooth;
  overflow-x: hidden;

  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'linear-gradient(rgba(8, 10, 24, 0) 0%, rgb(8 10 24 / 100%) 45%)'
      : 'linear-gradient(rgba(255, 255, 255, 0) 0%, rgb(255 255 255 /100%) 45%)'};
`

const Gradient = styled.div<{ isDarkMode: boolean }>`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  bottom: 0;
  width: 100%;
  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'linear-gradient(rgba(8, 10, 24, 0) 0%, rgb(8 10 24 / 100%) 45%)'
      : 'linear-gradient(rgba(255, 255, 255, 0) 0%, rgb(255 255 255 /100%) 45%)'};
  z-index: ${Z_INDEX.dropdown};
  pointer-events: none;
  height: ${({ theme }) => `calc(100vh - ${theme.mobileBottomBarHeight}px)`};
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    height: 100vh;
  }
`

const GlowContainer = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  bottom: 0;
  width: 100%;
  overflow-y: hidden;
  height: ${({ theme }) => `calc(100vh - ${theme.mobileBottomBarHeight}px)`};
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    height: 100vh;
  }
`

const Glow = styled.div`
  position: absolute;
  top: 68px;
  bottom: 0;
  background: radial-gradient(72.04% 72.04% at 50% 3.99%, #ff37eb 0%, rgba(166, 151, 255, 0) 100%);
  filter: blur(72px);
  border-radius: 24px;
  max-width: 480px;
  width: 100%;
  height: 100%;
`

const ContentContainer = styled.div<{ isDarkMode: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: min(720px, 90%);
  bottom: 0;
  position: sticky;
  z-index: ${Z_INDEX.dropdown};
  padding: 0 0 32px;
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} opacity`};

  margin: 0 0 16px;
  * {
    pointer-events: auto;
  }

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    padding: 0 0 44px;
  }
`

const TitleText = styled.h1<{ isDarkMode: boolean }>`
  color: transparent;
  font-size: 36px;
  line-height: 44px;
  font-weight: 500;
  text-align: center;
  margin: 0 0 24px;
  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'linear-gradient(20deg, rgba(255, 244, 207, 1) 10%, rgba(255, 87, 218, 1) 100%)'
      : 'linear-gradient(10deg, rgba(255,79,184,1) 0%, rgba(255,159,251,1) 100%)'};

  background-clip: text;
  -webkit-background-clip: text;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    font-size: 48px;
    line-height: 56px;
  }

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    font-size: 64px;
    line-height: 72px;
  }
`

const SubText = styled.h3`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  text-align: center;
  max-width: 600px;
  margin: 0 0 32px;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    font-size: 20px;
    line-height: 28px;
  }
`

const SubTextContainer = styled.div`
  display: flex;
  justify-content: center;
`

const LandingButton = styled(BaseButton)`
  padding: 16px 0px;
  border-radius: 24px;
`

const ButtonCTA = styled(LandingButton)`
  background: linear-gradient(93.06deg, #ff00c7 2.66%, #ff9ffb 98.99%);
  border: none;
  color: ${({ theme }) => theme.white};
  transition: ${({ theme }) => `all ${theme.transition.duration.medium} ${theme.transition.timing.ease}`};

  &:hover {
    box-shadow: 0px 0px 16px 0px #ff00c7;
  }
`

const ButtonCTAText = styled.p`
  margin: 0px;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    font-size: 20px;
  }
`

const ActionsContainer = styled.span`
  max-width: 300px;
  width: 100%;
`

const LearnMoreContainer = styled.div`
  align-items: center;
  color: ${({ theme }) => theme.textTertiary};
  cursor: pointer;
  font-size: 20px;
  font-weight: 600;
  margin: 36px 0 0;
  display: flex;
  visibility: hidden;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    visibility: visible;
  }
`

const LearnMoreArrow = styled(ArrowDownCircle)`
  margin-left: 14px;
  size: 20px;
`

const AboutContentContainer = styled.div<{ isDarkMode: boolean }>`
  margin: 10rem 0 0;
  padding: 0 24px 5rem;
  width: 100%;
  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'linear-gradient(179.82deg, rgba(0, 0, 0, 0) 0.16%, #050026 99.85%)'
      : 'linear-gradient(179.82deg, rgba(255, 255, 255, 0) 0.16%, #eaeaea 99.85%)'};
  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    padding: 0 96px 5rem;
    margin: 5rem 0 0;
  }
`

const CardGrid = styled.div<{ cols: number }>`
  display: grid;
  gap: 12px;
  width: 100%;
  padding: 24px 0 0;

  grid-template-columns: 1fr;
  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    // At this screen size, we show up to 2 columns.
    grid-template-columns: ${({ cols }) =>
      Array.from(Array(cols === 2 ? 2 : 1))
        .map(() => '1fr')
        .join(' ')};
    gap: 32px;
  }

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    // at this screen size, always show the max number of columns
    grid-template-columns: ${({ cols }) =>
      Array.from(Array(cols))
        .map(() => '1fr')
        .join(' ')};
    gap: 32px;
  }
`

const LandingSwap = styled(Swap)`
  * {
    pointer-events: none;
  }

  &:hover {
    border: 1px solid ${({ theme }) => theme.accentAction};
    transform: translateY(-4px);
  }
`

const Link = styled(NativeLink)`
  text-decoration: none;
  max-width: 480px;
  width: 100%;
`

export default function AboutLanding() {
  const isDarkMode = useIsDarkMode()

  const cardsRef = useRef<HTMLDivElement>(null)

  const location = useLocation()
  const isOpen = location.pathname === '/'

  if (!isOpen) return null

  return (
    <Trace page={PageName.LANDING_PAGE} shouldLogImpression>
      <PageContainer isDarkMode={isDarkMode}>
        <TraceEvent
          events={[BrowserEvent.onClick]}
          name={EventName.ELEMENT_CLICKED}
          element={ElementName.LANDING_PAGE_SWAP_ELEMENT}
        >
          <Link to="/swap">
            <LandingSwap />
          </Link>
        </TraceEvent>
        <Gradient isDarkMode={isDarkMode} />
        <GlowContainer>
          <Glow />
        </GlowContainer>
        <ContentContainer isDarkMode={isDarkMode}>
          <TitleText isDarkMode={isDarkMode}>Trade crypto & NFTs with confidence</TitleText>
          <SubTextContainer>
            <SubText>Buy, sell, and explore tokens and NFTs</SubText>
          </SubTextContainer>
          <ActionsContainer>
            <TraceEvent
              events={[BrowserEvent.onClick]}
              name={EventName.ELEMENT_CLICKED}
              element={ElementName.CONTINUE_BUTTON}
            >
              <ButtonCTA as={Link} to="/swap">
                <ButtonCTAText>Get started</ButtonCTAText>
              </ButtonCTA>
            </TraceEvent>
          </ActionsContainer>
          <LearnMoreContainer
            onClick={() => {
              cardsRef?.current?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <Trans>Learn more</Trans>
            <LearnMoreArrow />
          </LearnMoreContainer>
        </ContentContainer>
        <AboutContentContainer isDarkMode={isDarkMode}>
          <CardGrid cols={2} ref={cardsRef}>
            {MAIN_CARDS.map(({ darkBackgroundImgSrc, lightBackgroundImgSrc, ...card }) => (
              <Card
                {...card}
                backgroundImgSrc={isDarkMode ? darkBackgroundImgSrc : lightBackgroundImgSrc}
                key={card.title}
              />
            ))}
          </CardGrid>
          <CardGrid cols={3}>
            {MORE_CARDS.map(({ darkIcon, lightIcon, ...card }) => (
              <Card {...card} icon={isDarkMode ? darkIcon : lightIcon} key={card.title} type={CardType.Secondary} />
            ))}
          </CardGrid>
          <ProtocolBanner />
        </AboutContentContainer>
      </PageContainer>
    </Trace>
  )
}
