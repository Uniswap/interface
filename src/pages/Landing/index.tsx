import { Trans } from '@lingui/macro'
import { Trace, TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, InterfacePageName, SharedEventName } from '@uniswap/analytics-events'
import { AboutFooter } from 'components/About/AboutFooter'
import Card, { CardType } from 'components/About/Card'
import { MAIN_CARDS, MORE_CARDS } from 'components/About/constants'
import ProtocolBanner from 'components/About/ProtocolBanner'
import { BaseButton } from 'components/Button'
import Swap from 'pages/Swap'
import { parse } from 'qs'
import { useEffect, useRef, useState } from 'react'
import { ArrowDownCircle } from 'react-feather'
import { useLocation, useNavigate } from 'react-router-dom'
import { Link as NativeLink } from 'react-router-dom'
import { useAppSelector } from 'state/hooks'
import { useIsDarkMode } from 'state/user/hooks'
import styled, { css } from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

import headerBG from './images/forge-header.png'

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
  background: linear-gradient(0deg, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.7));
`

const Gradient = styled.div<{ isDarkMode: boolean }>`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 72px;
  bottom: 0;
  width: 100%;
  min-height: 550px;
  background: linear-gradient(rgba(0, 0, 0, 0) 0%, rgb(0 0 0 / 88%) 45%);
  z-index: ${Z_INDEX.under_dropdown};
  pointer-events: none;
  height: ${({ theme }) => `calc(100vh - ${theme.mobileBottomBarHeight}px)`};
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    top: 72px;
    height: calc(100vh - 72px);
  }
`

const GlowContainer = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 72px;
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
  opacity: 0.5;
  bottom: 0;
  background: radial-gradient(72.04% 72.04% at 50% 3.99%, #ed4e33 0%, rgba(166, 151, 255, 0) 100%);
  filter: blur(72px);
  border-radius: 24px;
  max-width: 480px;
  width: 100%;
  height: 100%;
`

const ContentContainer = styled.div<{ isDarkMode: boolean }>`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 0 40px;
  min-height: 500px;
  max-width: min(720px, 90%);
  z-index: ${Z_INDEX.under_dropdown};
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} opacity`};
  height: ${({ theme }) => `calc(100vh - ${theme.navHeight + theme.mobileBottomBarHeight}px)`};
  pointer-events: none;
  * {
    pointer-events: auto;
  }
  @media screen and (min-width: ${BREAKPOINTS.xl}px) {
    padding: 0 0 1rem;
    justify-content: center;
    top: 200px;
  }
`

const TitleText = styled.h1<{ isDarkMode: boolean }>`
  color: transparent;
  font-size: 36px;
  line-height: 44px;
  font-weight: 700;
  text-align: center;
  margin: 0 0 24px;
  text-transform: uppercase;
  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'linear-gradient(20deg, rgba(255, 244, 207, 1) 10%, rgba(237, 78, 51, 1) 80%)'
      : 'linear-gradient(10deg, rgba(255,79,184,1) 0%, rgba(255,159,251,1) 100%)'};
  background-clip: text;
  -webkit-background-clip: text;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    font-size: 48px;
    line-height: 56px;
  }

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    font-size: 54px;
    line-height: 62px;
  }
`

const SubText = styled.div`
  color: #faf1e4;
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
  background: linear-gradient(93.06deg, #ed4e33 12.66%, #531c12 98.99%);
  border: none;
  color: ${({ theme }) => theme.white};
  transition: ${({ theme }) => `all ${theme.transition.duration.medium} ${theme.transition.timing.ease}`};

  &:hover {
    box-shadow: 0px 0px 16px 0px #ed4e33;
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
  pointer-events: auto;
`

const LearnMoreContainer = styled.div`
  align-items: center;
  color: #faf1e4;
  cursor: pointer;
  font-size: 20px;
  font-weight: 600;
  margin: 36px 0 0;
  display: flex;
  visibility: hidden;
  pointer-events: auto;
  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    visibility: visible;
  }

  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} opacity`};

  &:hover {
    opacity: 0.6;
  }
`

const LearnMoreArrow = styled(ArrowDownCircle)`
  margin-left: 14px;
  size: 20px;
`

const AboutContentContainer = styled.div<{ isDarkMode: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 24px 5rem;
  width: 100%;
  background: rgba(0, 0, 0, 0);
  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    margin-top: 40px;
    padding: 0 96px 5rem;
  }
`

const CardGrid = styled.div<{ cols: number }>`
  display: grid;
  gap: 12px;
  width: 100%;
  padding: 40px 0 0;
  max-width: 1440px;
  scroll-margin: ${({ theme }) => `${theme.navHeight}px 0 0`};

  grid-template-columns: 1fr;
  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    // At this screen size, we show up to 2 columns.
    grid-template-columns: ${({ cols }) =>
      Array.from(Array(cols === 2 ? 2 : 1))
        .map(() => '1fr')
        .join(' ')};
    gap: 40px;
  }

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    // at this screen size, always show the max number of columns
    grid-template-columns: ${({ cols }) =>
      Array.from(Array(cols))
        .map(() => '1fr')
        .join(' ')};
    gap: 40px;
  }
`

const LandingSwapContainer = styled.div`
  height: ${({ theme }) => `calc(100vh - ${theme.mobileBottomBarHeight}px)`};
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    z-index: 1;
    background-image: url(${headerBG});
    background-size: cover;
    background-position: -200px center;
    height: calc(100vh - 72px);
  }
`

const SwapCss = css`
  * {
    pointer-events: none;
  }
  transform: scale(0.95);
  &:hover {
    transform: translateY(-4px);
    transition: ${({ theme }) => `transform ${theme.transition.duration.medium} ${theme.transition.timing.ease}`};
  }
`

const LinkCss = css`
  text-decoration: none;
  max-width: 480px;
  width: 100%;
`

const LandingSwap = styled(Swap)`
  ${SwapCss}
  &:hover {
    border: 1px solid ${({ theme }) => theme.accentAction};
  }
`

const Link = styled(NativeLink)`
  ${LinkCss}
`

export default function Landing() {
  const isDarkMode = useIsDarkMode()

  const cardsRef = useRef<HTMLDivElement>(null)

  const [showContent, setShowContent] = useState(false)
  const selectedWallet = useAppSelector((state) => state.user.selectedWallet)
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = parse(location.search, {
    ignoreQueryPrefix: true,
  })

  const swapWidgetEnabled = false

  // This can be simplified significantly once the flag is removed! For now being explicit is clearer.
  useEffect(() => {
    if (queryParams.intro || !selectedWallet) {
      setShowContent(true)
    } else {
      navigate('/swap')
    }
  }, [navigate, selectedWallet, queryParams.intro])

  return (
    <Trace page={InterfacePageName.LANDING_PAGE} shouldLogImpression>
      {showContent && (
        <PageContainer isDarkMode={isDarkMode} data-testid="landing-page">
          <LandingSwapContainer>
            <TraceEvent
              events={[BrowserEvent.onClick]}
              name={SharedEventName.ELEMENT_CLICKED}
              element={InterfaceElementName.LANDING_PAGE_SWAP_ELEMENT}
            >
              {swapWidgetEnabled ? (
                <Link to="/swap">
                  <LandingSwap intro={true} />
                </Link>
              ) : (
                <Link to="/swap">
                  <LandingSwap intro={true} />
                </Link>
              )}
            </TraceEvent>
          </LandingSwapContainer>
          <Gradient isDarkMode={isDarkMode} />
          <GlowContainer>
            <Glow />
          </GlowContainer>
          <ContentContainer isDarkMode={isDarkMode}>
            <TitleText isDarkMode={isDarkMode}>The strongest interchain exchange</TitleText>
            <SubTextContainer>
              <SubText>Swap, earn, and build on the premier Evmos community owned DEX</SubText>
            </SubTextContainer>
            <ActionsContainer>
              <TraceEvent
                events={[BrowserEvent.onClick]}
                name={SharedEventName.ELEMENT_CLICKED}
                element={InterfaceElementName.CONTINUE_BUTTON}
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
          <AboutContentContainer isDarkMode={true}>
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
            <AboutFooter />
          </AboutContentContainer>
        </PageContainer>
      )}
    </Trace>
  )
}
