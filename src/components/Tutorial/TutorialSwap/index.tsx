import { Trans } from '@lingui/macro'
import React, { CSSProperties, memo, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserView } from 'react-device-detect'
import { ChevronUp } from 'react-feather'
import { Flex } from 'rebass'
import styled, { createGlobalStyle } from 'styled-components'
import { CardinalOrientation, Step, Walktour, WalktourLogic } from 'walktour'

import WelcomeImage from 'assets/images/tutorial_swap/welcome.png'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { ToggleItemType } from 'components/Collapse'
import { TutorialType, getTutorialVideoId } from 'components/Tutorial'
import { SUPPORTED_WALLETS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { useIsDarkMode } from 'state/user/hooks'
import { ExternalLink } from 'theme'

import CustomMask from './CustomMask'
import CustomPopup from './CustomPopup'
import TutorialMobile from './TutorialMobile'
import { LIST_TITLE, StepCustom, TOTAL_STEP, TutorialIds } from './constant'

const isMobile = window.innerWidth < 1200 // best resolution for this tutorial

const Heading = styled.h5`
  color: ${({ theme }) => theme.text};
  user-select: none;
  margin: 5px 0px 10px 0px;
  display: flex;
  align-items: center;
  font-size: 16px;
`

const LayoutWrapper = styled.div`
  color: ${({ theme }) => theme.subText};
  text-align: left;
  font-size: 14px;
`
const Title = ({ stepNumber }: { stepNumber: number }) => {
  const theme = useTheme()
  return (
    <Heading style={{ display: 'flex', alignItems: 'flex-end' }}>
      <Trans>
        <span>Step: {stepNumber}/</span>
        <span style={{ color: theme.subText, fontSize: '0.85em' }}>{TOTAL_STEP}</span>
      </Trans>
    </Heading>
  )
}

const Layout = ({ children, title }: { title?: string; children: React.ReactNode }) => {
  return (
    <LayoutWrapper>
      {!isMobile && title && <Heading>{title}</Heading>}
      {children}
    </LayoutWrapper>
  )
}

const ArrowWrapper = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ theme }) => theme.text};
  svg {
    transition: all 150ms ease-in-out;
  }
  &[data-expanded='false'] {
    svg {
      transform: rotate(180deg);
    }
  }
`

const NetworkItemWrapper = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 42px;
  display: flex;
  padding: 10px 15px;
  gap: 10px;
  cursor: pointer;
`

const NetworkWrapper = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 20px;
  padding: 15px;
  gap: 10px;
  display: flex;
  flex-direction: column;
`

const ImageMobile = ({ imageName, marginTop = false }: { imageName: string; marginTop?: boolean }) =>
  isMobile ? (
    <Flex justifyContent={'center'}>
      <img
        style={{ marginTop: marginTop ? 20 : 0, width: '100%', maxWidth: 800 }}
        src={require(`../../../assets/images/tutorial_swap/${imageName}`).default}
        alt={imageName}
      />
    </Flex>
  ) : null

const Desc = styled.p`
  line-height: 20px;
`

const HighlightText = styled.span`
  color: ${({ theme }) => theme.text};
`
function Welcome() {
  return (
    <Layout>
      <img src={WelcomeImage} alt="welcome to kyberswap" style={{ maxWidth: '100%', marginTop: 10 }} />
      <Desc>
        <Trans>
          KyberSwap is a decentralized exchange (DEX) aggregator. We provide our traders with the{' '}
          <HighlightText>best token prices</HighlightText> by analyzing rates across thousands of exchanges instantly!
        </Trans>
      </Desc>
      <Desc>
        <Trans>
          KyberSwap is also an automated market maker (AMM) with industry-leading liquidity protocols and{' '}
          <HighlightText>concentrated liquidity</HighlightText>. Liquidity providers can add liquidity to our pools &{' '}
          <HighlightText>earn fees</HighlightText>!
        </Trans>
      </Desc>
      <Desc>
        <Trans>
          We created this <HighlightText>quick tutorial</HighlightText> guide for you to highlight KyberSwap&#39;s main
          features.
        </Trans>
      </Desc>
      <Desc>
        <Trans>Do you wish to have a look?</Trans>
      </Desc>
    </Layout>
  )
}

function Step1() {
  const [isExpanded, setIsExpanded] = useState(false)
  const toggleExpand = () => setIsExpanded(!isExpanded)
  const isDarkMode = useIsDarkMode()
  return (
    <Layout title={LIST_TITLE.CONNECT_WALLET}>
      <Desc>
        <Trans>Choose your preferred wallet, connect it, and get started with KyberSwap!</Trans>
      </Desc>
      <ImageMobile imageName="step1.png" />
      <BrowserView>
        <Heading onClick={toggleExpand} style={{ cursor: 'pointer' }}>
          <Trans>Download Wallet</Trans>
          <ArrowWrapper data-expanded={isExpanded}>
            <ChevronUp size={15} onClick={toggleExpand} />
          </ArrowWrapper>
        </Heading>
        {isExpanded && (
          <NetworkWrapper>
            {Object.values(SUPPORTED_WALLETS)
              .filter(e => e.installLink)
              .map(item => (
                <NetworkItemWrapper key={item.name} onClick={() => window.open(item.installLink)}>
                  <img
                    src={require(`../../../assets/images/${isDarkMode ? '' : 'light-'}${item.iconName}`).default}
                    alt={item.name}
                    width="20"
                    height="20"
                  />
                  <span>{item.name}</span>
                </NetworkItemWrapper>
              ))}
          </NetworkWrapper>
        )}
      </BrowserView>
    </Layout>
  )
}

const TouchAbleVideo = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
`

function Step3({ videoStyle = {} }: { videoStyle: CSSProperties }) {
  const { mixpanelHandler } = useMixpanel()
  const [playedVideo, setPlayedVideo] = useState(false)
  const ref = useRef<HTMLIFrameElement | null>(null)

  const playVideo = () => {
    const iframe = ref.current
    if (iframe) {
      // play video
      iframe.setAttribute('src', iframe.getAttribute('src') + '?autoplay=1')
      mixpanelHandler(MIXPANEL_TYPE.TUTORIAL_VIEW_VIDEO_SWAP)
      setPlayedVideo(true)
    }
  }

  return (
    <Layout title={LIST_TITLE.START_TRADING}>
      <Desc>
        <Trans>
          Select from over thousands of tokens and start trading. KyberSwap finds you the best prices across multiple
          exchanges & combines them into one trade!
        </Trans>
      </Desc>
      <div style={{ position: 'relative' }}>
        <iframe
          ref={ref}
          width="100%"
          height="100%"
          style={videoStyle}
          src={`https://www.youtube.com/embed/${getTutorialVideoId(TutorialType.SWAP)}`}
          frameBorder="0"
          title="Tutorial kyberswap"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
        {/** because we need tracking we user click video, iframe youtube not fire any event for us. */}
        {!playedVideo && <TouchAbleVideo onClick={playVideo} />}
      </div>
    </Layout>
  )
}

// override lib css
const CustomCss = createGlobalStyle`
  [id^=walktour-tooltip-container]:focus-visible {
    outline: none;
  };
`
const getListSteps = (isLogin: boolean) => {
  const isHighlightBtnConnectWallet = !isLogin || isMobile
  return [
    {
      title: (
        <Heading style={{ fontSize: 20 }}>
          <Trans>Welcome to KyberSwap!</Trans>
        </Heading>
      ),
      customFooterRenderer: (logic: WalktourLogic) => (
        <Flex justifyContent={'space-between'} style={{ gap: 25, marginTop: 20 }}>
          <ButtonOutlined onClick={() => logic.close()}>
            <Trans>Maybe later</Trans>
          </ButtonOutlined>
          <ButtonPrimary onClick={() => logic.next()}>
            <Trans>Let’s get started</Trans>
          </ButtonPrimary>
        </Flex>
      ),
      stepNumber: 0,
      description: <Welcome />,
      pcOnly: true,
      center: true,
      popupStyle: { width: 500 },
    },
    {
      selector: isHighlightBtnConnectWallet ? TutorialIds.BUTTON_CONNECT_WALLET : TutorialIds.BUTTON_ADDRESS_WALLET,
      title: isMobile ? (
        isHighlightBtnConnectWallet ? (
          LIST_TITLE.CONNECT_WALLET
        ) : (
          LIST_TITLE.YOUR_WALLET
        )
      ) : (
        <Title stepNumber={1} />
      ),
      stepNumber: 1,
      description: <Step1 />,
      orientationPreferences: [CardinalOrientation.SOUTHEAST, CardinalOrientation.NORTHWEST],
    },
    {
      selector: TutorialIds.SELECT_NETWORK,
      title: isMobile ? LIST_TITLE.SELECT_NETWORK : <Title stepNumber={2} />,
      stepNumber: 2,
      description: (
        <Layout title={LIST_TITLE.SELECT_NETWORK}>
          <Desc>
            <Trans>
              Choose your preferred network. KyberSwap is a multi chain platform that supports over 12 networks!
            </Trans>
          </Desc>
          <ImageMobile imageName="step2.png" />
        </Layout>
      ),
      orientationPreferences: [CardinalOrientation.SOUTHEAST, CardinalOrientation.NORTHWEST],
    },
    {
      selector: TutorialIds.SWAP_FORM,
      title: isMobile ? LIST_TITLE.START_TRADING : <Title stepNumber={3} />,
      stepNumber: 3,
      description: <Step3 videoStyle={{ minHeight: Math.min(window.innerHeight / 2, 500) }} />,
      popupStyle: { width: Math.min(0.8 * window.innerWidth, 700) },
      requiredClickSelector: '#' + TutorialIds.BUTTON_SETTING_SWAP_FORM,
      selectorHint: '#' + TutorialIds.SWAP_FORM_CONTENT,
    },
    {
      selector: TutorialIds.BUTTON_SETTING_SWAP_FORM,
      title: isMobile ? LIST_TITLE.SETTING : <Title stepNumber={4} />,
      stepNumber: 4,
      maskPadding: 10,
      description: (
        <Layout title={LIST_TITLE.SETTING}>
          <Desc>
            <Trans>You can customize advanced settings like slippage and other display settings here.</Trans>
          </Desc>
          <ImageMobile imageName="step4.1.png" />
          <ImageMobile imageName="step4.2.png" marginTop />
        </Layout>
      ),
      hasPointer: true,
      orientationPreferences: [CardinalOrientation.EAST, CardinalOrientation.NORTH],
      spotlightInteraction: true,
    },
    {
      selector: TutorialIds.SWAP_FORM,
      title: isMobile ? LIST_TITLE.SETTING : <Title stepNumber={4} />,
      stepNumber: 4,
      requiredClickSelector: '#' + TutorialIds.BUTTON_SETTING_SWAP_FORM,
      selectorHint: '#' + TutorialIds.TRADING_SETTING_CONTENT,
      description: (
        <Layout title={LIST_TITLE.SETTING}>
          <Desc>
            <Trans>Adjust the advanced settings for your trades like the max slippage.</Trans>
          </Desc>
          <Desc>
            <Trans>Personalize your trading interface in the display settings</Trans>
          </Desc>
        </Layout>
      ),
      pcOnly: true,
      callbackEndStep: () => document.getElementById(TutorialIds.BUTTON_SETTING_SWAP_FORM)?.click(),
      orientationPreferences: [CardinalOrientation.EAST, CardinalOrientation.NORTH],
      maskPadding: 10,
    },
    {
      selector: TutorialIds.EARNING_LINKS,
      title: isMobile ? LIST_TITLE.EARN : <Title stepNumber={5} />,
      stepNumber: 5,
      description: (
        <Layout title={LIST_TITLE.EARN}>
          <Desc>
            <Trans>
              Add liquidity into our Pools to earn trading fees & participate in our Farms to earn additional rewards!
            </Trans>
          </Desc>
          <ImageMobile imageName="step5.png" />
        </Layout>
      ),
      orientationPreferences: [CardinalOrientation.SOUTH],
    },
    {
      selector: TutorialIds.CAMPAIGN_LINK,
      title: isMobile ? LIST_TITLE.CAMPAIGN : <Title stepNumber={6} />,
      stepNumber: 6,
      description: (
        <Layout title={LIST_TITLE.CAMPAIGN}>
          <Desc>
            <Trans>Check out our latest trading campaigns and participate in them to earn rewards!</Trans>
          </Desc>
          <ImageMobile imageName="menu.png" />
          <ImageMobile imageName="step7.png" marginTop />
        </Layout>
      ),
      orientationPreferences: [CardinalOrientation.SOUTH],
    },
    {
      selector: TutorialIds.DISCOVER_LINK,
      title: isMobile ? LIST_TITLE.DISCOVER : <Title stepNumber={7} />,
      stepNumber: 7,
      description: (
        <Layout title={LIST_TITLE.DISCOVER}>
          <Desc>
            <Trans>
              Discover tokens before they start trending in the future! We analyze thousands of potential tokens &
              filter out the best ones for you!
            </Trans>
          </Desc>
          <ImageMobile imageName="menu.png" />
          <ImageMobile imageName="step6.png" marginTop />
        </Layout>
      ),
      orientationPreferences: [CardinalOrientation.SOUTH, CardinalOrientation.SOUTHEAST],
    },
    {
      selector: TutorialIds.BUTTON_VIEW_GUIDE_SWAP,
      title: isMobile ? LIST_TITLE.VIEW_GUIDE : <Title stepNumber={8} />,
      stepNumber: 8,
      maskPadding: 10,
      requiredClickSelector: '#' + TutorialIds.BUTTON_SETTING,
      stopPropagationMouseDown: true,
      description: (
        <Layout title={LIST_TITLE.VIEW_GUIDE}>
          <Desc>
            <Trans>
              You can repeat these instructions anytime by clicking on the &quot;View&quot; button under Preferences.
            </Trans>
          </Desc>
          <Desc>
            <Trans>
              For a more detailed user guide,{' '}
              <ExternalLink href="https://docs.kyberswap.com/guides/getting-started">click here.</ExternalLink>
            </Trans>
          </Desc>
          <ImageMobile imageName="step8.1.png" />
          <ImageMobile imageName="step8.2.png" marginTop />
        </Layout>
      ),
    },
  ]
}

const TutorialKeys = {
  SHOWED_SWAP_GUIDE: 'showedTutorialSwapGuide',
}

export default memo(function TutorialSwap() {
  const [{ show = false, step = 0 }, setShowTutorial] = useTutorialSwapGuide()
  const stopTutorial = () => setShowTutorial({ show: false })
  const { account } = useActiveWeb3React()
  const { mixpanelHandler } = useMixpanel()

  useEffect(() => {
    if (!localStorage.getItem(TutorialKeys.SHOWED_SWAP_GUIDE)) {
      // auto show for first time all user
      setShowTutorial({ show: true, step: 0 })
      localStorage.setItem(TutorialKeys.SHOWED_SWAP_GUIDE, '1')
    }
  }, [setShowTutorial])

  const steps = useMemo(() => {
    const list = getListSteps(!!account)
    if (isMobile) {
      return list
        .filter(e => !e.pcOnly)
        .map(({ title, description }, i) => ({
          title: `${i + 1}. ${title}`,
          content: description,
        }))
    }
    return list.map(e => ({
      ...e,
      description: e.description as unknown as string, // because this lib type check description is string but actually it accept any
      selector: '#' + e.selector,
    }))
  }, [account])

  const stepInfo = (steps[step] || {}) as StepCustom

  const onDismiss = (logic: WalktourLogic) => {
    const { stepNumber } = stepInfo
    mixpanelHandler(MIXPANEL_TYPE.TUTORIAL_CLICK_DENY, stepNumber)
    stopTutorial()
    logic.close()
  }

  const onFinished = () => {
    mixpanelHandler(MIXPANEL_TYPE.TUTORIAL_CLICK_DONE)
    stopTutorial()
  }

  const checkRequiredClick = (nextStep: StepCustom) => {
    const { requiredClickSelector, selectorHint } = nextStep
    const needClick = requiredClickSelector && !document.querySelector(selectorHint || nextStep?.selector)
    // target next step has not render yet, => click other button to render it
    // ex: click button setting to show setting popup, and then highlight content of setting
    if (needClick) {
      const button: HTMLButtonElement | null = document.querySelector(requiredClickSelector)
      button?.click()
    }
    return needClick
  }

  const processNextStep = ({ allSteps, prev, next, stepIndex }: WalktourLogic, isNext: boolean) => {
    const nextIndex = isNext ? stepIndex + 1 : stepIndex - 1
    const needClickAnyElement = checkRequiredClick(allSteps[nextIndex])
    const { callbackEndStep } = stepInfo
    callbackEndStep && callbackEndStep()
    setTimeout(
      () => {
        setShowTutorial({ step: nextIndex })
        isNext ? next() : prev()
      },
      needClickAnyElement ? 400 : 0,
    )
  }

  const onNext = (logic: WalktourLogic) => {
    const { stepIndex, close } = logic
    if (stepIndex - 1 === TOTAL_STEP) {
      onFinished()
      close()
      return
    }
    // next
    processNextStep(logic, true)
  }

  const onBack = (logic: WalktourLogic) => {
    processNextStep(logic, false)
  }

  if (!show) return null
  if (isMobile) return <TutorialMobile isOpen={show} stopTutorial={stopTutorial} steps={steps as ToggleItemType[]} />
  return (
    <>
      <Walktour
        tooltipSeparation={25}
        disableMaskInteraction
        customTooltipRenderer={(props: WalktourLogic | undefined) => (
          <CustomPopup {...(props || ({} as WalktourLogic))} />
        )}
        steps={steps as Step[]}
        isOpen={show}
        initialStepIndex={step}
        customNextFunc={onNext}
        customPrevFunc={onBack}
        customCloseFunc={onDismiss}
        renderMask={options => <CustomMask options={options} stepInfo={stepInfo} />}
      />
      <CustomCss />
    </>
  )
})
