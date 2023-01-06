import { Trace, TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, ElementName, EventName, PageName } from '@uniswap/analytics-events'
import BallsLogosImageSrc from 'assets/images/balls-logos.webp'
import BallsTopImageSrc from 'assets/images/balls-top.webp'
import Swap from 'pages/Swap'
import { Link } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'

import Modal from '../../components/Modal'

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

const LandingSwapContainer = styled.div`
  height: ${({ theme }) => `calc(100vh - ${theme.mobileBottomBarHeight}px)`};
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const IntroModal = styled(Modal)`
  &[data-reach-dialog-content] {
    max-width: 464px;
    width: 100%;
    flex-direction: column;
    padding: 50px 10px;
    position: relative;
    background: #131727;
    border: none;
    translate: calc(var(--removed-body-scroll-bar-size) / 2 * -1);
    margin: 140px auto;
  }
`

const IntroModalBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 110px;
`

const BallsTopImage = styled.img`
  width: 100%;
  display: block;
  filter: blur(1.5px) drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  aspect-ratio: 4.286;
`

const BallsLogosImage = styled.img`
  width: 45%;
  display: block;
  margin-top: -10px;
  margin-bottom: 23px;
  aspect-ratio: 1.35;
`

const BallsOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(20, 24, 40, 0.8) 0%, rgba(20, 24, 40, 0) 100%);
`

const IntroModalContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
`

const IntroModalTitle = styled.h4`
  font-size: 38px;
  font-weight: 700;
  color: #0a98fe;
  margin: 0;
  text-align: center;
`

const IntroModalDescription = styled.p`
  font-size: 18px;
  font-weight: 400;
  color: #ffffff;
  margin: 0;
  margin-top: 14px;
  max-width: 350px;
  text-align: center;
`

const IntroModalButton = styled(Link)`
  display: inline-flex;
  background: linear-gradient(94.52deg, #009eff 0%, #ff00e5 100%);
  border-radius: 5px;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 45px;
  text-decoration: none;
  color: #ffffff;
  margin-top: 50px;
  font-weight: 600;
  font-size: 16px;
`

const BlurredBlob = styled.div`
  position: absolute;
  width: 503px;
  height: 474px;
  top: 0;
  left: -100px;

  background: linear-gradient(180deg, rgba(247, 86, 124, 0.0435) 0%, rgba(0, 158, 255, 0.15) 100%);
  filter: blur(77.5px);
  transform: rotate(180deg);
`

export default function Landing() {
  const isDarkMode = useIsDarkMode()

  return (
    <Trace page={PageName.LANDING_PAGE} shouldLogImpression>
      <PageContainer isDarkMode={isDarkMode} data-testid="landing-page">
        <LandingSwapContainer>
          <TraceEvent
            events={[BrowserEvent.onClick]}
            name={EventName.ELEMENT_CLICKED}
            element={ElementName.LANDING_PAGE_SWAP_ELEMENT}
          >
            <Swap />
          </TraceEvent>
        </LandingSwapContainer>
        <IntroModal isOpen isFloodStyle>
          <BlurredBlob />
          <IntroModalBackground>
            <BallsTopImage src={BallsTopImageSrc} alt="Balls" aria-hidden={true} />
            <BallsOverlay />
          </IntroModalBackground>
          <IntroModalContent>
            <BallsLogosImage src={BallsLogosImageSrc} alt="Balls with Uniswap and Flood logos" aria-hidden={true} />
            <IntroModalTitle>Open the floodgates</IntroModalTitle>
            <IntroModalDescription>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl nec aliquam aliquam, nunc nisl
              euismod.
            </IntroModalDescription>
            <IntroModalButton to="/swap">Open app</IntroModalButton>
          </IntroModalContent>
        </IntroModal>
      </PageContainer>
    </Trace>
  )
}
