import { Trace } from '@uniswap/analytics'
import { PageName } from '@uniswap/analytics-events'
import { ButtonOutlined } from 'components/Button'
import { useLayoutEffect, useRef, useState } from 'react'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

import Card from './Card'
import { CARDS, STEPS } from './constants'
import Step from './Step'
import { SubTitle, Title } from './Title'

const Page = styled.span<{ isDarkMode: boolean; titleHeight: number }>`
  width: 100%;
  align-self: center;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding-top: calc(100vh - ${({ titleHeight }) => titleHeight + 200}px);
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
  gap: 96px;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    padding: 0px 80px 80px 80px;
  }
`

const CardGrid = styled.div`
  display: grid;
  gap: 36px;
  width: 100%;
  grid-template-columns: 1fr;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    grid-template-columns: 1fr 1fr;
  }
`

const InfoButton = styled(ButtonOutlined)`
  font-size: 20px;
  line-height: 24px;
  padding: 12px;
`

const ActionsContainer = styled.span`
  display: flex;
  gap: 24px;
  width: 100%;

  & > * {
    flex: 1;
  }

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    flex-direction: column;
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

const PoweredBySection = styled(Panels)`
  order: 1;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    order: 0;
  }
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
            Uniswap is the largest on-chain marketplace for tokens and NFTs.
          </Title>
          <PoweredBySection>
            <div>
              <SubTitle isDarkMode={isDarkMode}>Powered by the Uniswap Protocol</SubTitle>
            </div>
            <Intro>
              <IntroCopy>The leading decentralized crypto trading protocol, governed by a global community.</IntroCopy>
              <ActionsContainer>
                <InfoButton as="a" rel="noopener noreferrer" href="https://uniswap.org" target="_blank">
                  Learn more
                </InfoButton>
                <InfoButton as="a" rel="noopener noreferrer" href="https://docs.uniswap.org" target="_blank">
                  Read the docs
                </InfoButton>
              </ActionsContainer>
            </Intro>
          </PoweredBySection>
          <CardGrid>
            {CARDS.map((card) => (
              <Card key={card.title} {...card} />
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
                    expanded={selectedStepIndex === index}
                    onClick={() => setSelectedStepIndex(index)}
                    index={index}
                    key={step.title}
                    title={step.title}
                    description={step.description}
                  />
                ))}
              </StepList>
            </Panels>
          </div>
        </Content>
      </Page>
    </Trace>
  )
}
