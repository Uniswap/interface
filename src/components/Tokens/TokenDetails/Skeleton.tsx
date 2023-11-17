import { Trans } from '@lingui/macro'
import { SwapSkeleton } from 'components/swap/SwapSkeleton'
import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import { useInfoTDPEnabled } from 'featureFlags/flags/infoTDP'
import { ArrowLeft, ChevronRight } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { textFadeIn } from 'theme/styles'

import { LoadingBubble } from '../loading'
import { AboutContainer, AboutHeader } from './About'
import { BreadcrumbNav, BreadcrumbNavLink } from './BreadcrumbNavLink'
import { ChartContainer } from './ChartSection'
import { StatPair, StatsWrapper, StatWrapper } from './StatsSection'

const SWAP_COMPONENT_WIDTH = 360

export const Hr = styled.hr`
  background-color: ${({ theme }) => theme.surface3};
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
    padding: 0 16px 52px;
  }
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    gap: 40px;
    padding: 48px 20px;
  }
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.xl}px) {
    gap: 60px;
  }
`
export const LeftPanel = styled.div`
  flex: 1;
  max-width: 780px;
  overflow: hidden;
`
export const RightPanel = styled.div<{ isInfoTDPEnabled?: boolean }>`
  display: none;
  flex-direction: column;
  gap: ${({ isInfoTDPEnabled }) => (isInfoTDPEnabled ? 40 : 20)}px;
  width: ${SWAP_COMPONENT_WIDTH}px;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.lg}px) {
    display: flex;
  }
`
const LoadingChartContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  height: 100%;
  margin-bottom: 44px;
  padding-bottom: 66px;
  overflow: hidden;
`
export const TokenInfoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  ${textFadeIn};
  animation-duration: ${({ theme }) => theme.transition.duration.medium};
`
export const TokenNameCell = styled.div`
  display: flex;
  gap: 8px;
  font-size: 20px;
  line-height: 28px;
  align-items: center;
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
const NavBubble = styled(DetailBubble)`
  width: 169px;
`
const TokenLogoBubble = styled(DetailBubble)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
`
const TitleBubble = styled(DetailBubble)`
  width: 136px;
`
const PriceBubble = styled(SquaredBubble)`
  margin-top: 4px;
  height: 40px;
`

const SectionBubble = styled(SquaredBubble)`
  width: 120px;
`
const StatTitleBubble = styled(DetailBubble)`
  width: 80px;
  margin-bottom: 4px;
`
const StatBubble = styled(SquaredBubble)`
  width: 116px;
`
const WideBubble = styled(DetailBubble)`
  margin-bottom: 6px;
  width: 100%;
`

const ThinTitleBubble = styled(WideBubble)`
  width: 120px;
`

const HalfWideBubble = styled(WideBubble)`
  width: 50%;
`

const StatsLoadingContainer = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
`

const ExtraDetailsContainer = styled.div`
  padding-top: 24px;
`

const ChartAnimation = styled.div`
  animation: wave 8s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite;
  display: flex;
  overflow: hidden;
  margin-top: 90px;

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
      <path d="M 0 80 Q 104 10, 208 80 T 416 80" stroke={theme.surface3} fill="transparent" strokeWidth="2" />
    </svg>
  )
}

export function LoadingChart() {
  return (
    <ChartContainer>
      <ThemedText.HeadlineLarge>
        <PriceBubble />
      </ThemedText.HeadlineLarge>
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
    </ChartContainer>
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
  const isInfoExplorePageEnabled = useInfoExplorePageEnabled()
  const isInfoTDPEnabled = useInfoTDPEnabled()

  return (
    <LeftPanel>
      {isInfoTDPEnabled ? (
        <BreadcrumbNav isInfoTDPEnabled>
          <BreadcrumbNavLink to={`${isInfoExplorePageEnabled ? '/explore' : ''}/tokens/${chainName}`}>
            <Trans>Explore</Trans> <ChevronRight size={14} /> <Trans>Tokens</Trans> <ChevronRight size={14} />
          </BreadcrumbNavLink>{' '}
          <NavBubble />
        </BreadcrumbNav>
      ) : (
        <BreadcrumbNav>
          <BreadcrumbNavLink
            to={(isInfoExplorePageEnabled ? '/explore' : '') + (chainName ? `/tokens/${chainName}` : `/tokens`)}
          >
            <ArrowLeft size={14} /> Tokens
          </BreadcrumbNavLink>
        </BreadcrumbNav>
      )}
      <TokenInfoContainer>
        <TokenNameCell>
          <TokenLogoBubble />
          <TitleBubble />
        </TokenNameCell>
      </TokenInfoContainer>
      <LoadingChart />

      <Space heightSize={4} />
      <LoadingStats />
      <Hr />
      <AboutContainer>
        <AboutHeader>
          <SectionBubble />
        </AboutHeader>
      </AboutContainer>
      <WideBubble />
      <WideBubble />
      <HalfWideBubble style={{ marginBottom: '24px' }} />
      <ExtraDetailsContainer>
        <ThinTitleBubble />
        <HalfWideBubble />
      </ExtraDetailsContainer>
      <ExtraDetailsContainer>
        <ThinTitleBubble />
        <HalfWideBubble />
      </ExtraDetailsContainer>
    </LeftPanel>
  )
}

export function TokenDetailsPageSkeleton() {
  return (
    <TokenDetailsLayout>
      <TokenDetailsSkeleton />
      <RightPanel>
        <SwapSkeleton />
      </RightPanel>
    </TokenDetailsLayout>
  )
}
