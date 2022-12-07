import { ButtonCTA } from 'components/Button'
import { LandingPageVariant, useLandingPageFlag } from 'featureFlags/flags/landingPage'
import { useLocation, useNavigate } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

const MOBILE_BREAKPOINT = BREAKPOINTS.sm
const DESKTOP_BREAKPOINT = BREAKPOINTS.md

const PageWrapper = styled.div<{ isDarkMode: boolean }>`
  width: 100%;
  height: calc(100vh - 72px);
  position: absolute;
  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'linear-gradient(rgba(8, 10, 24, 0) 9.84%, rgb(8 10 24 / 86%) 35.35%)'
      : 'linear-gradient(rgba(8, 10, 24, 0) 9.84%, rgb(255 255 255 / 86%) 35.35%)'};
  z-index: ${Z_INDEX.sticky};
  display: flex;
  flex-direction: column;
  justify-content: end;
  padding: 24px 24px 64px 24px;
  align-items: center;
  transition: 250ms ease opacity;

  @media screen and (min-width: ${MOBILE_BREAKPOINT}px) {
    padding: 4rem;
  }

  @media screen and (min-width: ${DESKTOP_BREAKPOINT}px) {
    padding: 2rem;
  }
`

const TitleText = styled.h1<{ isDarkMode: boolean }>`
  color: transparent;
  font-size: 36px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 0px;
  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'linear-gradient(20deg, rgba(255, 244, 207, 1) 10%, rgba(255, 87, 218, 1) 100%)'
      : 'linear-gradient(10deg, rgba(255,79,184,1) 0%, rgba(255,159,251,1) 100%)'};

  background-clip: text;
  -webkit-background-clip: text;

  @media screen and (min-width: ${MOBILE_BREAKPOINT}px) {
    font-size: 48px;
  }

  @media screen and (min-width: ${DESKTOP_BREAKPOINT}px) {
    font-size: 72px;
  }
`

const SubText = styled.h3`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 16px;
  font-weight: 400;
  text-align: center;

  @media screen and (min-width: ${MOBILE_BREAKPOINT}px) {
    font-size: 20px;
  }

  @media screen and (min-width: ${DESKTOP_BREAKPOINT}px) {
    font-size: 28px;
  }
`

const ButtonCTAText = styled.p`
  margin: 0px;
  font-size: 16px;
  white-space: nowrap;

  @media screen and (min-width: ${MOBILE_BREAKPOINT}px) {
    font-size: 20px;
  }

  @media screen and (min-width: ${DESKTOP_BREAKPOINT}px) {
    font-size: 24px;
  }
`

const TitleContentWrapper = styled.span`
  max-width: 720px;
`

const ContentWrapper = styled.span`
  max-width: 720px;
`

export default function Landing() {
  const isDarkMode = useIsDarkMode()

  const navigate = useNavigate()

  const location = useLocation()
  const isOpen = location.pathname === '/'

  const onContinueClick = () => navigate('/swap')

  if (useLandingPageFlag() === LandingPageVariant.Control || !isOpen) return null

  return (
    <PageWrapper isDarkMode={isDarkMode}>
      <TitleContentWrapper>
        <TitleText isDarkMode={isDarkMode}>Trade crypto & NFTs with confidence.</TitleText>
        <SubText>
          Swap tokens with the deepest liquidity and <br /> buy NFTs at the best prices.
        </SubText>
      </TitleContentWrapper>
      <ContentWrapper>
        <ButtonCTA onClick={onContinueClick}>
          <ButtonCTAText>Continue</ButtonCTAText>
        </ButtonCTA>
      </ContentWrapper>
    </PageWrapper>
  )
}
