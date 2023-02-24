import box1img from 'assets/images/wallet/1.png'
import box2img from 'assets/images/wallet/2.png'
import box3img from 'assets/images/wallet/3.png'
import { ReactComponent as appstore } from 'assets/images/wallet/app_store.svg'
import { ReactComponent as AppleI } from 'assets/images/wallet/apple.svg'
import backgroundImg1 from 'assets/images/wallet/Background-01.png'
import backgroundImg2 from 'assets/images/wallet/Background-02.png'
import backgroundImg3 from 'assets/images/wallet/Background-03.png'
import screenImg2 from 'assets/images/wallet/home.png'
import iconImg1 from 'assets/images/wallet/Icon-01.svg'
import iconImg2 from 'assets/images/wallet/Icon-02.svg'
import iconImg3 from 'assets/images/wallet/Icon-03.svg'
import iphoneImg from 'assets/images/wallet/iPhone-13-Pro-Front.png'
import lockImg from 'assets/images/wallet/lock.svg'
import screenImg3 from 'assets/images/wallet/nfts.png'
import qrImg from 'assets/images/wallet/qr.png'
import secureImg from 'assets/images/wallet/secure.svg'
import screenImg1 from 'assets/images/wallet/swap.png'
import walletImg from 'assets/images/wallet/wallet.svg'
import { APP_STORE_LINK } from 'components/WalletDropdown/DownloadButton'
import { useAtom } from 'jotai'
import React, { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react'
import { useCloseModal } from 'state/application/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { ThemeMode, themeModeAtom } from 'theme/components/ThemeToggle'

import { VideoComponent } from './Video'

const ClipWrapper = styled.div`
  width: 100%;
  overflow: clip;
`

const ContentWrapperWallet = styled.div`
  margin-bottom: 0px;
  position: relative;
  z-index: 1;
  text-align: center;
  justify-content: center;
  max-width: 1008px;
  padding: 0 24px 32px 24px;
  @media (min-width: 480px) {
    max-width: 1056px;
    padding: 0 48px 32px 48px;
  }
  @media (min-width: 768px) {
    text-align: center;
  }
  margin-left: auto;
  margin-right: auto;
`

const Image = styled.img`
  width: 100%;
  transition: transform 0.4s ease-in-out; /* Animation */
`

const Title = styled.h1`
  margin-bottom: 48px;
  font-weight: 500;
  font-size: 24px;
  line-height: 28px;

  background: linear-gradient(90.2deg, #bf8df0 8.24%, #fa07ff 96.76%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (min-width: 480px) {
    font-size: 32px;
    line-height: 36px;
  }
  @media (min-width: 768px) {
    font-size: 48px;
    line-height: 60px;
  }
`

const CardTitle = styled.h2`
  padding: 32px 24px 16px;
  font-weight: 500;
  font-size: 24px;
  line-height: 32px;
  margin: 0px;
  letter-spacing: -0.02em;
`

const TraitTitle = styled.h2`
  color: black;
  font-weight: 500;
  margin-bottom: 4px;
  margin-top: 0px;
  letter-spacing: -0.02em;
  font-size: 18px;
  line-height: 24px;
`

const TraitDescription = styled.div`
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.01em;

  font-feature-settings: 'pnum' on, 'lnum' on, 'ss02' on, 'zero' on;

  /* Grey/600 */
  color: #404a67;
`

const Traits = styled.div`
  margin-top: 48px;
  img {
    width: 36px;
    height: 36px;
    margin-bottom: 12px;
  }
  gap: 40px;

  text-align: left;
  margin-left: auto;
  margin-right: auto;
  display: grid;
  column-gap: 12px;
  @media (min-width: 768px) {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    img {
      margin: 0;
      margin-bottom: 12px;
    }
    text-align: left;

    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`

const CardContent = styled.div<{ height?: string }>`
  margin-left: auto;
  margin-right: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  width: 100%;
  @media (min-width: 768px) {
    margin-left: 0;
    margin-right: 0;
  }
  border-radius: 16px;
  background: white;

  box-shadow: 8px 12px 20px rgba(51, 53, 72, 0.04), 4px 6px 12px rgba(51, 53, 72, 0.02),
    4px 4px 8px rgba(51, 53, 72, 0.04);
  overflow: hidden;
  &:hover ${Image} {
    transform: scale(1.1);
  }

  &.is-visible {
    opacity: 1;
    visibility: visible;
  }
`

const Layout = styled.div`
  position: relative;
  padding-bottom: 48px;
  color: #330733;
  width: 100%;
`
const Reset = styled.div`
  position: absolute;
  z-index: -10;
  top: 0;
  left: 0;
  background: white;

  width: 100%;
  height: 100%;
`

const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  transform: translateY(80px);
  background: linear-gradient(328.69deg, #e8ecfb 21.34%, rgba(255, 255, 255, 0) 81.6%);
  /* background-size: 200% 200%; */

  animation: gradient 10s ease infinite;
  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`

const Grid = styled.div`
  display: grid;
  grid-gap: 16px;
  margin: 96px 0;
`
const GridRow = styled.div<{ height?: string }>`
  display: grid;
  grid-gap: 16px;
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`

const Footer = styled.div`
  position: relative;
  z-index: 2;

  display: flex;

  flex-direction: column;
  align-items: flex-start;
  padding: 24px 24px;
  gap: 12px;

  @media (min-width: 480px) {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding-right: 48px;
    padding-left: 48px;
    gap: 40px;
  }

  @media (min-width: 768px) {
    width: 100%;
    padding-top: 48px;
    padding-bottom: 48px;
    justify-content: left;
  }

  @media (min-width: 1086px) {
    width: 990px;
    padding-left: 0;
    padding-right: 0;
    margin-left: auto;
    margin-right: auto;
  }

  a {
    text-decoration: none;
    color: black;
    font-size: 18px;

    &:hover {
      opacity: 0.7;
    }
  }
`

const AppleIcon = styled(AppleI)<{ size?: number; fill?: string }>`
  height: ${({ size }) => (size ? size + 'px' : '29px')};
  width: ${({ size }) => (size ? size + 'px' : '29px')};
  opacity: 1;
`

const AppStore = styled(appstore)<{ size?: number; fill?: string }>`
  opacity: 1;
  width: 140px;
  height: auto;
`

const Hero = styled.div`
  background: linear-gradient(180deg, #ff57da 0%, #e92b9c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  padding: 40px;
  font-weight: 600;
  font-size: 48px;
  line-height: 60px;
  z-index: 10;
  pointer-events: none;
  @media (min-width: ${({ theme }) => theme.breakpoint.sm}px) {
    font-size: 60px;
    line-height: 72px;
  }
  @media (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    font-size: 60px;
    line-height: 72px;
    max-width: 710px;
  }
  @media (min-width: ${({ theme }) => theme.breakpoint.lg}px) {
    font-size: 60px;
    line-height: 72px;
    max-width: 750px;
  }
  @media (min-width: ${({ theme }) => theme.breakpoint.xl}px) {
    font-size: 72px;
    line-height: 80px;
    max-width: 880px;
  }
  @media (min-width: ${({ theme }) => theme.breakpoint.xxl}px) {
    font-size: 80px;
    line-height: 92px;
    max-width: 980px;
  }
  @media (min-width: ${({ theme }) => theme.breakpoint.xxxl}px) {
    font-size: 88px;
    line-height: 100px;
    max-width: 1070px;
  }
`

const Overlay = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  height: 100vh;
  width: 100vw;
`
const QR = styled.div`
  position: absolute;
  border-radius: 16px;
  background: white;
  z-index: 10;
  display: flex;
  align-items: center;
  flex-direction: column;
  bottom: 100px;
  right: 40px;
  box-shadow: 0px 0px 60px rgba(241, 75, 219, 0.4);
  padding: 12px 12px 16px;
  visibility: hidden;
  transition: transform 300ms ease;

  @media (min-width: ${({ theme }) => theme.breakpoint.xl}px) {
    position: fixed;
    bottom: 32px;
    top: unset;
  }

  @media (min-width: 768px) {
    visibility: visible;
  }
  img {
    width: 140px;
    height: 140px;
    margin-bottom: 16px;

    @media (min-width: ${({ theme }) => theme.breakpoint.xxxl}px) {
      width: 210px;
      height: 210px;
    }
  }
  span {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px;
    gap: 4px;
    height: 16px;
    font-weight: 600;
    font-size: 14px;
    line-height: 16px;
    color: black;
  }
  :hover {
    transform: translateY(-10px);
  }
`

function QRCode() {
  return (
    <QR>
      <img src={qrImg} alt="qr code" />
      <span>
        <AppleIcon size={16} /> Scan to Download
      </span>
    </QR>
  )
}

const DownloadButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  padding: 0;
  border-radius: 10px;
  border: none;
  transition: box-shadow 0.25s ease-in-out;
  z-index: 10;
  span {
    padding-top: 2px;
  }
  &:hover {
    box-shadow: 0px 5px 30px rgba(241, 75, 219, 0.72);
    cursor: pointer;
  }
  &:active {
    box-shadow: 0px 0px 60px rgba(241, 75, 219, 0.1);
    transition: box-shadow 0.125s ease-in-out;
  }
`

const VideoSection = styled.div`
  max-width: 100%;
  position: relative;
  margin: auto;
  text-align: center;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`

function Card({ title, className, children }: PropsWithChildren<{ title: string; className?: string }>) {
  return (
    <CardContent className={className}>
      <CardTitle>{title}</CardTitle>
      {children}
    </CardContent>
  )
}

const HCC = styled.div`
  height: 240vh;
  width: 100%;
  margin-top: 96px;
  margin-bottom: 96px;
  @media (min-height: 792px) {
    margin-bottom: 40px;
  }
`

const Phone = styled.div`
  max-width: 480px;
  height: calc(100vh - 128px);
  position: sticky;
  top: 72px;
  margin-left: auto;
  margin-right: auto;
  @media (min-width: 768px) {
    width: 100%;
    max-width: none;
    left: 0;
    top: max(calc((100vh - 792px) / 2), 72px);
  }
`
const PhoneOverlay = styled.div`
  position: absolute;
  top: 0;
  width: 100%;
  height: 75%;
  max-height: 640px;
  margin-bottom: 40px;

  @media (max-height: 910px) and (max-width: 768px) {
    height: 50%;
  }

  @media (min-width: 768px) {
    width: 360px;
    height: 720px;
    max-height: 100%;
  }

  img {
    position: absolute;
    bottom: 0;
    left: -9999px;
    right: -9999px;
    margin: auto;
    max-height: 486px;
    height: 90%;

    aspect-ratio: 0.49342105263;
    @media (min-width: 768px) {
      right: 0;
      left: auto;

      margin: 0;
      max-height: none;

      max-height: 608px;
    }
  }
`
const BGImageWrapper = styled.div`
  position: absolute;
  z-index: -19;
  top: 0;
  left: -9999px;
  right: -9999px;
  margin-left: auto;
  margin-right: auto;
  /* height: 100%; */
  height: 75%;
  max-width: none;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  transition: opacity 300ms ease-in-out;
  will-change: opacity, visibility;

  &.is-visible {
    opacity: 1;
    visibility: visible;
  }

  @media (min-width: 768px) {
    left: -150px;
    width: 720px;
    height: 720px;
    right: none;
    margin: 0;

    @media (max-height: 672px) {
      left: -22.321vh;
    }
  }
`

const BGImage = styled.div<{ src: string }>`
  width: 100%;
  height: 100%;
  background: ${({ src }) => `url(${src}) no-repeat`};
  background-size: 480px 480px;
  background-position-x: center;

  @media (min-width: 768px) {
    background-size: 720px 720px;

    @media (max-height: 720px) {
      background-size: 100vh 100vh;
    }
  }
`

const LargeHeader = styled(ThemedText.LargeHeader)`
  margin-left: auto;
  margin-right: auto;
  margin-top: 0;
  padding-bottom: 24px;

  font-size: 24px !important;

  letter-spacing: -0.02em;
  font-weight: 500 !important;

  //Small Phone
  @media (min-width: 640px) {
    font-size: 32px !important;
  }

  @media (min-width: 768px) {
    margin-top: 0;
    margin-right: 0;
    margin-left: 0;
    font-size: 48px !important;
  }
`

const PhoneContent = styled.div`
  position: absolute;
  width: 100%;
  max-width: 480px;
  /* height: 100vh; */
  height: 100%;
  margin-bottom: 40px;

  display: flex;
  flex-direction: column;
  &.is-visible {
    opacity: 1;
    visibility: visible;
  }

  @media (min-width: 768px) {
    align-items: end;
    flex-direction: row;
    width: 100%;
    max-width: none;
    height: 720px;
    max-height: 100%;
  }

  .image-container {
    position: relative;
    max-width: 480px;
    max-height: 640px;
    height: 75%;
    margin-right: 0px;
    display: flex;
    justify-content: center;
    align-items: end;
    opacity: 0;
    visibility: hidden;
    transition: opacity 300ms ease-in-out;
    will-change: opacity, visibility;

    &.is-visible {
      opacity: 1;
      visibility: visible;
    }

    //Small Phone
    @media (max-height: 910px) and (max-width: 768px) {
      height: 50%;
    }

    @media (min-width: 768px) {
      justify-content: flex-end;
      align-items: end;

      min-width: 360px;
      width: 360px;
      height: 100%;
      max-height: 720px;
      margin-right: 48px;
      padding-right: 2px;
    }

    @media (min-width: 1024px) {
      margin-right: 60px;
    }
  }

  .screen {
    z-index: 10;
    max-height: 486px;
    height: 90%;
    aspect-ratio: 0.4859967;

    @media (min-width: 768px) {
      max-height: 608px;
    }
  }
  .icon {
    display: none;
    @media (min-width: 768px) {
      display: block;
    }
  }
  .column {
    flex-grow: 1;
    justify-content: space-between;
    display: flex;
    flex-direction: column;
  }

  .text-wrapper {
    margin-top: 20px;
    @media (min-width: 768px) {
      display: flex;
      align-items: end;
      height: calc(100% - 12px);
    }
    opacity: 0;
    visibility: hidden;
    transition: opacity 300ms ease-in-out;
    will-change: opacity, visibility;

    &.is-visible {
      opacity: 1;
      visibility: visible;
    }
  }

  .text-container {
    display: flex;
    align-items: center;
    flex-direction: column;
    flex-grow: 1;
    margin-right: 0px;
    text-align: center;
    @media (min-width: 768px) {
      align-items: start;
      text-align: left;
      margin-right: 32px;
    }

    img {
      @media (max-height: 460px) {
        display: none;
      }
      margin-bottom: 40px;
    }

    p {
      color: #404a67;
      font-size: 16px;
      line-height: 24px;
      font-weight: 400;
      letter-spacing: -0.01em;
      margin: 0;

      @media (min-width: 768px) {
        font-size: 20px;
        line-height: 28px;
        letter-spacing: -0.01em;
      }
    }
  }
`
const Ellipse = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;

  flex-shrink: 0;

  background-color: #5d67853d;

  &.active {
    background-color: #98a1c0;
  }
`

function _PageIndicator({ index, visible, className }: { index: number; visible: boolean; className?: string }) {
  const visClass = visible ? 'is-visible' : ''
  return (
    <div className={`${className} ${visClass}`}>
      <Ellipse className={`${index === 0 ? 'active' : ''}`} />
      <Ellipse className={`${index === 1 ? 'active' : ''}`} />
      <Ellipse className={`${index === 2 ? 'active' : ''}`} />
    </div>
  )
}

const PageIndicator = styled(_PageIndicator)`
  position: absolute;
  height: 90%;
  max-height: 486px;
  bottom: 0;
  left: calc(50% + 144px);

  @media (max-height: 910px) and (max-width: 768px) {
    left: calc(50% + 96px);
  }

  display: flex;
  justify-content: center;
  flex-direction: column;

  gap: 12px;

  @media (min-width: 768px) {
    display: none;
  }

  visibility: hidden;
  &.is-visible {
    visibility: visible;
  }
  -webkit-transition: none;
  -moz-transition: none;
  -o-transition: none;
  -ms-transition: none;
  transition: none;
`

function HeroCarouselContainer() {
  const [domRef, setDomRef] = useState<HTMLDivElement | null>(null)
  const test = useMemo(() => {
    const rect = domRef?.getBoundingClientRect()
    return rect ? new DOMRect(rect.left + window.scrollX, rect.top + window.scrollY, rect.width, rect.height) : null
  }, [domRef])

  const page1 = useRef<HTMLDivElement>(null)
  const page2 = useRef<HTMLDivElement>(null)
  const page3 = useRef<HTMLDivElement>(null)
  const pages = useMemo(
    () => [
      {
        bgImage: backgroundImg1,
        screenImage: screenImg1,
        iconImage: iconImg1,
        title: 'Safely swap on the go',
        description:
          'Safely store your keys, stay on top of price changes, swap via the Uniswap protocol and monitor your transactions all from one simple app.',
        ref: page1,
      },
      {
        bgImage: backgroundImg2,
        screenImage: screenImg2,
        iconImage: iconImg2,
        title: 'Multiple chains, one unified experience',
        description:
          'Manage all of your tokens across Ethereum, Polygon, Optimism, and Arbitrum without switching between apps or chains. Connect to the Uniswap Web App to load crypto into your wallet at some of the best rates in the industry.',
        ref: page2,
      },
      {
        bgImage: backgroundImg3,
        screenImage: screenImg3,
        iconImage: iconImg3,
        title: 'A home for all your NFTs',
        description:
          'Display and view your NFTs alongside your tokens. Stay on top of latest floor prices, number of owners, and volume for your NFTs’ collections. Search and favorite wallets to stay up to date on their NFT collections.',
        ref: page3,
      },
    ],
    [page1, page2, page3]
  )

  const [index, setIndex] = useState(0)
  useEffect(() => {
    function scrollHandler() {
      if (test && window.scrollY - test.top > 0) {
        const percentage = (window.scrollY - test.top) / window.innerHeight

        const imageRef = pages[index].ref.current
        if (imageRef) {
          let percentageScroll
          if (percentage > 1.2) {
            // We are passed the end of the phone component so
            percentageScroll = percentage - 0.2
          } else {
            percentageScroll = (percentage % 0.4) / 0.4
          }
          const rotation = percentageScroll * 30 // rotate up to 30 degrees
          imageRef.style.transform = `rotate(${rotation}deg)`
        }

        const newIndex = Math.min(Math.floor(percentage / 0.4), 2)
        setIndex(newIndex)
      }
    }

    window.addEventListener('scroll', scrollHandler, { passive: true })
    return () => window.removeEventListener('scroll', scrollHandler)
  }, [index, pages, test])

  return (
    <HCC ref={setDomRef}>
      <Phone>
        {pages.map((page, i) => {
          const { bgImage, screenImage, iconImage, title, description } = page
          const visible = index === i
          return (
            <PhoneContent key={i}>
              <BGImageWrapper className={visible ? 'is-visible' : ''}>
                <BGImage src={bgImage} ref={page.ref} />
              </BGImageWrapper>
              <div className={`image-container ${visible ? 'is-visible' : ''}`}>
                <img className="screen" src={screenImage} alt="phone screen" />
              </div>
              <div className={`text-wrapper ${visible ? 'is-visible' : ''}`}>
                <div className="text-container">
                  <img className="icon" src={iconImage} alt="phone icon" />
                  <LargeHeader>{title}</LargeHeader>
                  <p>{description}</p>
                </div>
              </div>
            </PhoneContent>
          )
        })}
        <PhoneOverlay>
          <img src={iphoneImg} alt="iphone" />
          <PageIndicator index={index} visible={true} />
        </PhoneOverlay>
      </Phone>
    </HCC>
  )
}

const VideoBackground = styled.div`
  position: absolute;
  transform: translateY(-72px);
  background: linear-gradient(to left, rgba(255, 70, 254, 0.1) 0%, #fce5ff 100%),
    linear-gradient(to bottom, rgba(247, 145, 241, 0.311), rgba(70, 221, 255, 0.1));
  height: calc(100vh + 15% + 72px);
  width: 100%;
  -webkit-mask: linear-gradient(#fff, transparent);
  mask: linear-gradient(black, transparent);
`

export default function WalletPage(): JSX.Element {
  const [themeMode, setThemeMode] = useAtom(themeModeAtom)
  const initalThemeMode = useRef(themeMode)

  const closeWalletModal = useCloseModal()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      closeWalletModal()
    }
  }, [closeWalletModal])

  useEffect(() => {
    const initialMode = initalThemeMode.current
    if (initialMode !== ThemeMode.LIGHT) setThemeMode(ThemeMode.LIGHT)

    return () => {
      if (initialMode !== ThemeMode.LIGHT) setThemeMode(initialMode)
    }
  }, [setThemeMode])

  return (
    <Layout>
      <Reset />
      <Background />
      <Overlay>
        <QRCode />
      </Overlay>

      <VideoSection>
        <Hero>The power of Uniswap in your pocket</Hero>
        <DownloadButton onClick={() => window.open(APP_STORE_LINK)}>
          <AppStore />
        </DownloadButton>
        <VideoBackground />
        <VideoComponent />
      </VideoSection>
      <ClipWrapper>
        <ContentWrapperWallet>
          <Title>One wallet for everything</Title>
          <HeroCarouselContainer />
          <Grid>
            <GridRow height="420px" className="md:grid-cols-3">
              <Card title="Explore top tokens and crypto wallets">
                <Image className="px-0 pb-0" src={box1img} />
              </Card>

              <Card title="Connect to crypto apps with Wallet Connect">
                <Image src={box2img} />
              </Card>
              <Card title="Stay up to date on the go">
                <Image src={box3img} />
              </Card>
            </GridRow>
          </Grid>
          <ThemedText.LargeHeader fontWeight={500} fontSize="36px">
            Secure and private self-custody
          </ThemedText.LargeHeader>
          <Traits className="grid gap-x-3 md:grid-cols-3">
            <div>
              <img src={secureImg} alt="secure" />
              <TraitTitle>Secure</TraitTitle>
              <TraitDescription>
                Your recovery phrase is stored in the iPhone secure enclave. If you opt to back up your recovery phrase
                to iCloud, you’ll be protected by Apple’s industry leading security and an additional layer of
                encryption at the app level.
              </TraitDescription>
            </div>

            <div>
              <img src={walletImg} alt="wallet" />
              <TraitTitle>Self-custodial</TraitTitle>
              <TraitDescription>
                Store your own crypto by creating a new wallet or an importing an existing one. Your assets are always
                in your control, and you can always import wallets you create on Uniswap Wallet to other apps.
              </TraitDescription>
            </div>

            <div>
              <img src={lockImg} alt="lock" />
              <TraitTitle>Private</TraitTitle>
              <TraitDescription>
                Keep your identity private — Uniswap Wallet does not require an email or name to use.
              </TraitDescription>
            </div>
          </Traits>
        </ContentWrapperWallet>
      </ClipWrapper>
      <Footer>
        <a href="https://discord.com/invite/FCfyBSbCU5">
          <span className="text">Discord</span>
        </a>
        <a href="https://twitter.com/Uniswap">
          <span className="text">Twitter</span>
        </a>

        <a href="https://github.com/Uniswap">
          <span className="text">Github</span>
        </a>

        <a href="https://help.uniswap.org/en/">
          <span className="text">Help Center</span>
        </a>
      </Footer>
    </Layout>
  )
}
