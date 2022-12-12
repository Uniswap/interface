import { Trace } from '@uniswap/analytics'
import { PageName } from '@uniswap/analytics-events'
import { ButtonOutlined } from 'components/Button'
import { useLayoutEffect, useRef, useState } from 'react'
import { BookOpen, Globe, Heart, Twitter } from 'react-feather'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

import Card from './Card'
import { CARDS, STEPS } from './constants'
import backgroundImgSrcDark from './images/About_BG_Dark.jpg'
import backgroundImgSrcLight from './images/About_BG_Light.jpg'
import Step from './Step'
import { SubTitle, Title } from './Title'

const Page = styled.div<{ isDarkMode: boolean; titleHeight: number }>`
  position: relative;
  width: 100%;
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: calc(100vh - ${({ titleHeight }) => titleHeight + 200}px);
`

const PageBackground = styled.div<{ isDarkMode: boolean }>`
  position: absolute;
  width: 100%;
  height: 100vh;
  top: -${({ theme }) => theme.navHeight}px;
  left: 0;
  opacity: ${({ isDarkMode }) => (isDarkMode ? 0.4 : 0.2)};
  background: ${({ isDarkMode }) => (isDarkMode ? `url(${backgroundImgSrcDark})` : `url(${backgroundImgSrcLight})`)};
  -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
  background-size: cover;
  background-repeat: no-repeat;
`

const Panels = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 24px;
  line-height: 36px;
  gap: 24px;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    gap: 120px;
    flex-direction: row;
    align-items: center;
  }

  & > * {
    flex: 1;
  }
`

const Content = styled.div`
  max-width: 1280px;
  pointer-events: all;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 0px 16px 16px 16px;
  gap: 48px;
  z-index: 1;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    padding: 0px 80px 80px 80px;
    gap: 96px;
  }
`

const CardGrid = styled.div`
  display: grid;
  gap: 12px;
  width: 100%;
  grid-template-columns: 1fr;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
`

const InfoButton = styled(ButtonOutlined)`
  font-size: 16px;
  line-height: 20px;
  padding: 12px;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    font-size: 20px;
    line-height: 24px;
  }
`

const ActionsContainer = styled.span`
  display: flex;
  gap: 16px;
  width: 100%;

  & > * {
    flex: 1;
  }

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    gap: 24px;
  }

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    flex-direction: column;
    gap: 24px;
  }

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    flex-direction: row;
  }
`

const StepList = styled.div`
  display: flex;
  flex-direction: column;
`

const Intro = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`

const IntroCopy = styled.p`
  font-size: 16px;
  line-height: 24px;
  margin: 0;
`

const ThumbnailContainer = styled.div`
  align-self: center;
`

const Thumbnail = styled.img`
  width: 100%;
`

const FooterLinks = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
`

const FooterLink = styled.a`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  color: ${({ theme }) => theme.textPrimary};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  font-size: 16px;
  line-height: 20px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;

  svg {
    color: ${({ theme }) => theme.textSecondary};
    stroke-width: 1.5;
  }

  &:hover {
    border: 1px solid ${({ theme }) => theme.textTertiary};
  }

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    font-size: 20px;
    line-height: 24px;
  }
`

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 48px;
`

const Copyright = styled.span`
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.textTertiary};
`

const WrappedExternalArrow = styled.span`
  color: ${({ theme }) => theme.textTertiary};
  margin-left: 4px;
`

export default function About() {
  const isDarkMode = useIsDarkMode()

  const titleRef = useRef<HTMLDivElement>(null)
  const [titleHeight, setTitleHeight] = useState(0)
  useLayoutEffect(() => {
    if (titleRef.current) {
      setTitleHeight(titleRef.current.scrollHeight)
    }
  }, [])

  const [selectedStepIndex, setSelectedStepIndex] = useState(0)
  const selectedStep = STEPS[selectedStepIndex]
  const thumbnailImgSrc = isDarkMode ? selectedStep?.darkImgSrc : selectedStep?.lightImgSrc

  return (
    <Trace page={PageName.ABOUT_PAGE} shouldLogImpression>
      <Page isDarkMode={isDarkMode} titleHeight={titleHeight}>
        <Content>
          <Title ref={titleRef} isDarkMode={isDarkMode}>
            Uniswap is the leading on-chain marketplace for tokens and NFTs
          </Title>
          <Panels>
            <div>
              <SubTitle isDarkMode={isDarkMode}>Powered by the Uniswap Protocol</SubTitle>
            </div>
            <Intro>
              <IntroCopy>The leading decentralized crypto trading protocol, governed by a global community</IntroCopy>
              <ActionsContainer>
                <InfoButton as="a" rel="noopener noreferrer" href="https://uniswap.org" target="_blank">
                  Learn more<WrappedExternalArrow> ↗</WrappedExternalArrow>
                </InfoButton>
                <InfoButton as="a" rel="noopener noreferrer" href="https://docs.uniswap.org" target="_blank">
                  Read docs<WrappedExternalArrow> ↗</WrappedExternalArrow>
                </InfoButton>
              </ActionsContainer>
            </Intro>
          </Panels>
          <CardGrid>
            {CARDS.map(({ darkBackgroundImgSrc, lightBackgroundImgSrc, ...card }) => (
              <Card
                key={card.title}
                {...card}
                backgroundImgSrc={isDarkMode ? darkBackgroundImgSrc : lightBackgroundImgSrc}
              />
            ))}
          </CardGrid>
          <div>
            <SubTitle isDarkMode={isDarkMode}>Get Started</SubTitle>
            <Panels>
              <ThumbnailContainer>
                <Thumbnail alt="Thumbnail" src={thumbnailImgSrc} />
              </ThumbnailContainer>
              <StepList>
                {STEPS.map((step, index) => (
                  <Step
                    selected={selectedStepIndex === index}
                    onSelect={() => setSelectedStepIndex(index)}
                    index={index}
                    key={step.title}
                    title={step.title}
                  />
                ))}
              </StepList>
            </Panels>
          </div>
          <Footer>
            <FooterLinks>
              <FooterLink rel="noopener noreferrer" target="_blank" href="https://support.uniswap.org">
                <Globe /> Support
              </FooterLink>
              <FooterLink rel="noopener noreferrer" target="_blank" href="https://twitter.com/uniswap">
                <Twitter /> Twitter
              </FooterLink>
              <FooterLink rel="noopener noreferrer" target="_blank" href="https://uniswap.org/blog">
                <BookOpen /> Blog
              </FooterLink>
              <FooterLink rel="noopener noreferrer" target="_blank" href="https://boards.greenhouse.io/uniswaplabs">
                <Heart /> Careers
              </FooterLink>
            </FooterLinks>
            <Copyright>© {new Date().getFullYear()} Uniswap Labs</Copyright>
          </Footer>
        </Content>
        <PageBackground isDarkMode={isDarkMode} />
      </Page>
    </Trace>
  )
}
