import { darken } from 'polished'
import styled from 'styled-components/macro'

import {
  AboutHeader,
  AboutSection,
  BreadcrumbNavLink,
  ChartContainer,
  ChartHeader,
  ContractAddressSection,
  DeltaContainer,
  ResourcesContainer,
  StatsSection,
  TimeOptionsContainer,
  TokenInfoContainer,
  TokenPrice,
  TopArea,
} from './TokenDetail'

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.deprecate_text2};
  font-size: 14px;
  width: 168px;
  gap: 4px;
`

const TokenNameCell = styled.div`
  display: flex;
  gap: 8px;
  font-size: 20px;
  line-height: 28px;
  align-items: center;
`

/* Loading state bubbles */
const LoadingBubble = styled.div`
  background-color: ${({ theme }) => darken(0.08, theme.deprecate_bg3)};
  border-radius: 12px;
  height: 16px;
  width: 180px;
`
const TitleLoadingBubble = styled(LoadingBubble)`
  width: 140px;
`
const SquareLoadingBubble = styled(LoadingBubble)`
  height: 32px;
  border-radius: 8px;
  margin-top: 4px;
`
const PriceLoadingBubble = styled(SquareLoadingBubble)`
  height: 40px;
`
const LongLoadingBubble = styled(LoadingBubble)`
  width: 100%;
`
const HalfLoadingBubble = styled(LoadingBubble)`
  width: 50%;
`
const IconLoadingBubble = styled(LoadingBubble)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
`
const StatLoadingBubble = styled(SquareLoadingBubble)`
  width: 116px;
`
const StatsLoadingContainer = styled.div`
  display: flex;
  gap: 24px;
`
const ChartAnimation = styled.div`
  display: flex;
  animation: wave 8s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite;

  @keyframes wave {
    0% {
      margin-left: 0;
    }
    100% {
      margin-left: -800px;
    }
  }
`

/* Loading State: row component with loading bubbles */
export default function LoadingTokenDetail() {
  return (
    <TopArea>
      <BreadcrumbNavLink to="/explore">{null}</BreadcrumbNavLink>
      <ChartHeader>
        <TokenInfoContainer>
          <TokenNameCell>
            <IconLoadingBubble />
            <TitleLoadingBubble />
          </TokenNameCell>
        </TokenInfoContainer>
        <TokenPrice>
          <PriceLoadingBubble />
        </TokenPrice>
        <DeltaContainer>{null}</DeltaContainer>
        <ChartContainer>
          <ChartAnimation>
            <svg width="416" height="160" xmlns="http://www.w3.org/2000/svg">
              <path d="M 0 80 Q 104 10, 208 80 T 416 80" stroke="#2e3138" fill="transparent" strokeWidth="2" />
            </svg>
            <svg width="416" height="160" xmlns="http://www.w3.org/2000/svg">
              <path d="M 0 80 Q 104 10, 208 80 T 416 80" stroke="#2e3138" fill="transparent" strokeWidth="2" />
            </svg>
            <svg width="416" height="160" xmlns="http://www.w3.org/2000/svg">
              <path d="M 0 80 Q 104 10, 208 80 T 416 80" stroke="#2e3138" fill="transparent" strokeWidth="2" />
            </svg>
            <svg width="416" height="160" xmlns="http://www.w3.org/2000/svg">
              <path d="M 0 80 Q 104 10, 208 80 T 416 80" stroke="#2e3138" fill="transparent" strokeWidth="2" />
            </svg>
            <svg width="416" height="160" xmlns="http://www.w3.org/2000/svg">
              <path d="M 0 80 Q 104 10, 208 80 T 416 80" stroke="#2e3138" fill="transparent" strokeWidth="2" />
            </svg>
          </ChartAnimation>
        </ChartContainer>
        <TimeOptionsContainer>{null}</TimeOptionsContainer>
      </ChartHeader>
      <AboutSection>
        <AboutHeader>
          <SquareLoadingBubble />
        </AboutHeader>
        <LongLoadingBubble />
        <LongLoadingBubble />
        <HalfLoadingBubble />

        <ResourcesContainer>{null}</ResourcesContainer>
      </AboutSection>
      <StatsSection>
        <StatsLoadingContainer>
          <Stat>
            <HalfLoadingBubble />
            <StatLoadingBubble />
          </Stat>
          <Stat>
            <HalfLoadingBubble />
            <StatLoadingBubble />
          </Stat>
          <Stat>
            <HalfLoadingBubble />
            <StatLoadingBubble />
          </Stat>
          <Stat>
            <HalfLoadingBubble />
            <StatLoadingBubble />
          </Stat>
        </StatsLoadingContainer>
      </StatsSection>
      <ContractAddressSection>{null}</ContractAddressSection>
    </TopArea>
  )
}
