import { WidgetSkeleton } from 'components/Widget'
import { LeftPanel, RightPanel, TokenDetailsLayout } from 'pages/TokenDetails'
import { ArrowLeft } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'

import { LoadingBubble } from '../loading'
import { AboutContainer, AboutHeader, ResourcesContainer } from './About'
import { ContractAddressSection } from './AddressSection'
import { BreadcrumbNavLink } from './BreadcrumbNavLink'
import { ChartContainer, ChartHeader, TokenInfoContainer, TokenNameCell } from './ChartSection'
import { DeltaContainer, TokenPrice } from './PriceChart'
import { StatPair, StatWrapper, TokenStatsSection } from './StatsSection'

const LoadingChartContainer = styled(ChartContainer)`
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  height: 313px;
  overflow: hidden;
`

/* Loading state bubbles */
const LoadingDetailBubble = styled(LoadingBubble)`
  height: 17px;
  width: 180px;
`
const TitleLoadingBubble = styled(LoadingDetailBubble)`
  width: 140px;
`
const SquareLoadingBubble = styled(LoadingDetailBubble)`
  height: 34px;
  border-radius: 8px;
  margin-bottom: 10px;
`
const PriceLoadingBubble = styled(SquareLoadingBubble)`
  height: 40px;
`
const LongLoadingBubble = styled(LoadingDetailBubble)`
  margin-top: 6px;
  width: 100%;
`
const HalfLoadingBubble = styled(LoadingDetailBubble)`
  margin-top: 6px;
  width: 50%;
`
const IconLoadingBubble = styled(LoadingDetailBubble)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
`
const StatLoadingBubble = styled(SquareLoadingBubble)`
  width: 116px;
`
const StatsLoadingContainer = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
`
const ChartAnimation = styled.div`
  display: flex;
  animation: wave 8s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite;
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

export function Wave() {
  const theme = useTheme()
  return (
    <svg width="416" height="160" xmlns="http://www.w3.org/2000/svg">
      <path d="M 0 80 Q 104 10, 208 80 T 416 80" stroke={theme.backgroundOutline} fill="transparent" strokeWidth="2" />
    </svg>
  )
}

/* Loading State: row component with loading bubbles */
export default function LoadingTokenDetail() {
  const { chainName } = useParams<{ chainName?: string }>()
  return (
    <LeftPanel>
      <BreadcrumbNavLink to={{ chainName } ? `/tokens/${chainName}` : `/explore`}>
        <ArrowLeft size={14} /> Tokens
      </BreadcrumbNavLink>
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
        <DeltaContainer>
          <Space heightSize={20} />
        </DeltaContainer>
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
      <Space heightSize={71} />
      <TokenStatsSection>
        <StatsLoadingContainer>
          <StatPair>
            <StatWrapper>
              <HalfLoadingBubble />
              <StatLoadingBubble />
            </StatWrapper>
            <StatWrapper>
              <HalfLoadingBubble />
              <StatLoadingBubble />
            </StatWrapper>
          </StatPair>
          <StatPair>
            <StatWrapper>
              <HalfLoadingBubble />
              <StatLoadingBubble />
            </StatWrapper>
            <StatWrapper>
              <HalfLoadingBubble />
              <StatLoadingBubble />
            </StatWrapper>
          </StatPair>
        </StatsLoadingContainer>
      </TokenStatsSection>
      <Space heightSize={7.5} />
      <AboutContainer>
        <AboutHeader>
          <SquareLoadingBubble />
        </AboutHeader>
        <LongLoadingBubble />
        <LongLoadingBubble />
        <HalfLoadingBubble />

        <ResourcesContainer>{null}</ResourcesContainer>
      </AboutContainer>
      <ContractAddressSection>{null}</ContractAddressSection>
    </LeftPanel>
  )
}

export function LoadingTokenDetails() {
  return (
    <TokenDetailsLayout>
      <LoadingTokenDetail />
      <RightPanel>
        <WidgetSkeleton />
      </RightPanel>
    </TokenDetailsLayout>
  )
}
