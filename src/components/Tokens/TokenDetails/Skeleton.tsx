import { WidgetSkeleton } from 'components/Widget'
import { WIDGET_WIDTH } from 'components/Widget'
import { ArrowLeft } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'

import { LoadingBubble } from '../loading'
import { AboutContainer, AboutHeader } from './About'
import { BreadcrumbNavLink } from './BreadcrumbNavLink'
import { ChartContainer, ChartHeader, TokenInfoContainer, TokenNameCell } from './ChartSection'
import { DeltaContainer, TokenPrice } from './PriceChart'
import { StatPair, StatsWrapper, StatWrapper } from './StatsSection'

export const Hr = styled.hr`
  background-color: ${({ theme }) => theme.backgroundOutline};
  border: none;
  height: 0.5px;
`
export const TokenDetailsLayout = styled.div`
  display: flex;
  padding: 0 8px 52px;
  justify-content: center;
  width: 100%;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.sm}px) {
    gap: 16px;
    padding: 0 16px;
  }
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    gap: 20px;
    padding: 48px 20px;
  }
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.xl}px) {
    gap: 40px;
  }
`
export const LeftPanel = styled.div`
  flex: 1;
  max-width: 780px;
  overflow: hidden;
`
export const RightPanel = styled.div`
  display: none;
  flex-direction: column;
  gap: 20px;
  width: ${WIDGET_WIDTH}px;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.lg}px) {
    display: flex;
  }
`
const LoadingChartContainer = styled(ChartContainer)`
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  height: 313px; // save 1px for the border-bottom (ie y-axis)
  overflow: hidden;
`

/* Loading state bubbles */
const DetailBubble = styled(LoadingBubble)`
  height: 16px;
  width: 180px;
`
const SquaredBubble = styled(DetailBubble)`
  height: 32px;
  border-radius: 8px;
`
const TokenLogoBubble = styled(DetailBubble)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
`
const TitleBubble = styled(DetailBubble)`
  width: 140px;
`
const PriceBubble = styled(SquaredBubble)`
  height: 40px;
`
const DeltaBubble = styled(DetailBubble)`
  width: 96px;
`
const SectionBubble = styled(SquaredBubble)`
  width: 96px;
`
const StatTitleBubble = styled(DetailBubble)`
  width: 25%;
  margin-bottom: 4px;
`
const StatBubble = styled(SquaredBubble)`
  width: 50%;
`
const WideBubble = styled(DetailBubble)`
  margin-bottom: 6px;
  width: 100%;
`
const HalfWideBubble = styled(WideBubble)`
  width: 50%;
`

const StatsLoadingContainer = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
`
const ChartAnimation = styled.div`
  animation: wave 8s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite;
  display: flex;
  overflow: hidden;

  @keyframes wave {
    0% {
      margin-left: 0;
    }
    100% {
      margin-left: -800px;
    }
  }
`
const Space = styled.div<{ heightSize: number }>`
  height: ${({ heightSize }) => `${heightSize}px`};
`

function Wave() {
  const theme = useTheme()
  return (
    <svg width="416" height="160" xmlns="http://www.w3.org/2000/svg">
      <path d="M 0 80 Q 104 10, 208 80 T 416 80" stroke={theme.backgroundOutline} fill="transparent" strokeWidth="2" />
    </svg>
  )
}

function LoadingChart() {
  return (
    <ChartHeader>
      <TokenInfoContainer>
        <TokenNameCell>
          <TokenLogoBubble />
          <TitleBubble />
        </TokenNameCell>
      </TokenInfoContainer>
      <TokenPrice>
        <PriceBubble />
      </TokenPrice>
      <DeltaContainer>
        <DeltaBubble />
      </DeltaContainer>
      <Space heightSize={6} />
      <LoadingChartContainer>
        <div>
          <ChartAnimation>
            <Wave />
            <Wave />
            <Wave />
            <Wave />
            <Wave />
          </ChartAnimation>
        </div>
      </LoadingChartContainer>
    </ChartHeader>
  )
}

function LoadingStats() {
  return (
    <StatsWrapper>
      <SectionBubble />
      <StatsLoadingContainer>
        <StatPair>
          <StatWrapper>
            <StatTitleBubble />
            <StatBubble />
          </StatWrapper>
          <StatWrapper>
            <StatTitleBubble />
            <StatBubble />
          </StatWrapper>
        </StatPair>
        <StatPair>
          <StatWrapper>
            <StatTitleBubble />
            <StatBubble />
          </StatWrapper>
          <StatWrapper>
            <StatTitleBubble />
            <StatBubble />
          </StatWrapper>
        </StatPair>
      </StatsLoadingContainer>
    </StatsWrapper>
  )
}

/* Loading State: row component with loading bubbles */
export default function TokenDetailsSkeleton() {
  const { chainName } = useParams<{ chainName?: string }>()
  return (
    <LeftPanel>
      <BreadcrumbNavLink to={{ chainName } ? `/tokens/${chainName}` : `/explore`}>
        <ArrowLeft size={14} /> Tokens
      </BreadcrumbNavLink>
      <LoadingChart />
      <Space heightSize={45} />
      <LoadingStats />
      <Hr />
      <AboutContainer>
        <AboutHeader>
          <SectionBubble />
        </AboutHeader>
      </AboutContainer>
      <WideBubble />
      <WideBubble />
      <HalfWideBubble />
    </LeftPanel>
  )
}

export function TokenDetailsPageSkeleton() {
  return (
    <TokenDetailsLayout>
      <TokenDetailsSkeleton />
      <RightPanel>
        <WidgetSkeleton />
      </RightPanel>
    </TokenDetailsLayout>
  )
}
