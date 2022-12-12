import { Trace } from '@uniswap/analytics'
import { PageName } from '@uniswap/analytics-events'
import { BaseButton } from 'components/Button'
import { LandingPageVariant, useLandingPageFlag } from 'featureFlags/flags/landingPage'
import Swap from 'pages/Swap'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Link as NativeLink } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

const PageWrapper = styled.div`
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;

  height: ${({ theme }) => `calc(100vh - ${theme.navHeight + theme.mobileBottomBarHeight}px)`};
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    height: ${({ theme }) => `calc(100vh - ${theme.navHeight}px)`};
  }
`

const Gradient = styled.div<{ isDarkMode: boolean }>`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'linear-gradient(rgba(8, 10, 24, 0) 0%, rgb(8 10 24 / 100%) 45%)'
      : 'linear-gradient(rgba(255, 255, 255, 0) 0%, rgb(255 255 255 /100%) 45%)'};
  z-index: ${Z_INDEX.dropdown};
  pointer-events: none;
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
`

const ContentWrapper = styled.div<{ isDarkMode: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: min(720px, 90%);
  position: absolute;
  bottom: 0;
  z-index: ${Z_INDEX.dropdown};
  padding: 32px 0;
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} opacity`};

  * {
    pointer-events: auto;
  }

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    padding: 64px 0;
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
  background: linear-gradient(10deg, rgba(255, 0, 199, 1) 0%, rgba(255, 159, 251, 1) 100%);
  border: none;
  color: ${({ theme }) => theme.white};
  transition: ${({ theme }) => `all ${theme.transition.duration.medium} ${theme.transition.timing.ease}`};

  &:hover {
    box-shadow: 0px 0px 16px 0px #ff00c7;
  }
`

const ButtonCTASecondary = styled(LandingButton)`
  background: none;
  border: ${({ theme }) => `1px solid ${theme.textPrimary}`};
  color: ${({ theme }) => theme.textPrimary};
  transition: ${({ theme }) => `all ${theme.transition.duration.medium} ${theme.transition.timing.ease}`};

  &:hover {
    border: 1px solid rgba(255, 0, 199, 1);
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

const ActionsWrapper = styled.span`
  display: flex;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 600px;

  & > * {
    max-width: 288px;
    flex: 1;
  }

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    gap: 24px;
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

export default function Landing() {
  const isDarkMode = useIsDarkMode()

  const location = useLocation()
  const isOpen = location.pathname === '/'

  const landingPageFlag = useLandingPageFlag()

  useEffect(() => {
    if (landingPageFlag) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'auto'
      }
    }
    return () => {
      // need to have a return so the hook doesn't throw.
    }
  }, [landingPageFlag])

  if (landingPageFlag === LandingPageVariant.Control || !isOpen) return null

  return (
    <Trace page={PageName.LANDING_PAGE} shouldLogImpression>
      <PageWrapper>
        <Link to="/swap">
          <LandingSwap />
        </Link>
        <Glow />
        <Gradient isDarkMode={isDarkMode} />
        <ContentWrapper isDarkMode={isDarkMode}>
          <TitleText isDarkMode={isDarkMode}>Trade crypto & NFTs with confidence</TitleText>
          <SubTextContainer>
            <SubText>Buy, sell, and explore tokens and NFTs</SubText>
          </SubTextContainer>
          <ActionsWrapper>
            <ButtonCTA as={Link} to="/swap">
              <ButtonCTAText>Continue</ButtonCTAText>
            </ButtonCTA>
            <ButtonCTASecondary as={Link} to="/about">
              <ButtonCTAText>Learn more</ButtonCTAText>
            </ButtonCTASecondary>
          </ActionsWrapper>
        </ContentWrapper>
      </PageWrapper>
    </Trace>
  )
}
