import { Trace } from '@uniswap/analytics'
import { PageName } from '@uniswap/analytics-events'
import { BaseButton } from 'components/Button'
import { LandingPageVariant, useLandingPageFlag } from 'featureFlags/flags/landingPage'
import Swap from 'pages/Swap'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

const PADDING_BOTTOM = 64

const PageWrapper = styled.div<{ isDarkMode: boolean }>`
  height: 100%;
  width: 100%;
  position: absolute;
  bottom: 0;
  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'linear-gradient(rgba(8, 10, 24, 0) 9.84%, rgb(8 10 24 / 86%) 35.35%)'
      : 'linear-gradient(rgba(8, 10, 24, 0) 9.84%, rgb(255 255 255 / 86%) 35.35%)'};
  z-index: ${Z_INDEX.sticky};
  display: flex;
  flex-direction: column;
  justify-content: end;
  padding-bottom: 24px 24px ${PADDING_BOTTOM}px;
  align-items: center;
  transition: 250ms ease opacity;
  pointer-events: none;

  * {
    pointer-events: auto;
  }

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    padding: 64px 64px ${PADDING_BOTTOM}px;
  }

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    padding: 32px 32px ${PADDING_BOTTOM}px;
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
  padding: 16px;
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

  &:hover {
    border: 1px solid rgba(255, 0, 199, 1);
  }
`

const ButtonCTAText = styled.p`
  margin: 0px;
  font-size: 16px;
  white-space: nowrap;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    font-size: 20px;
  }

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    font-size: 24px;
  }
`

const TitleWrapper = styled.span`
  max-width: 720px;
`

const ActionsWrapper = styled.span`
  display: flex;
  justify-content: center;
  gap: 24px;
  width: 100%;

  & > * {
    max-width: 288px;
    flex: 1;
  }
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
      <PageWrapper isDarkMode={isDarkMode}>
        <TitleWrapper>
          <TitleText isDarkMode={isDarkMode}>Trade crypto & NFTs with confidence.</TitleText>
          <SubTextContainer>
            <SubText>Buy, sell, and explore tokens and NFTs </SubText>
          </SubTextContainer>
        </TitleWrapper>
        <ActionsWrapper>
          <ButtonCTA as={Link} to="/swap">
            <ButtonCTAText>Continue</ButtonCTAText>
          </ButtonCTA>
          <ButtonCTASecondary as={Link} to="/about">
            <ButtonCTAText>Learn more</ButtonCTAText>
          </ButtonCTASecondary>
        </ActionsWrapper>
      </PageWrapper>
      <Swap />
    </Trace>
  )
}
