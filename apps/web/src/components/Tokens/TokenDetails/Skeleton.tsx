import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import Row from 'components/Row'
import { SwapSkeleton } from 'components/swap/SwapSkeleton'
import { supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import { ReactNode } from 'react'
import { ChevronRight } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ClickableStyle } from 'theme/components'
import { textFadeIn } from 'theme/styles'
import { capitalize } from 'tsafe'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { ChartSkeleton } from 'components/Charts/LoadingState'
import { ChartType } from 'components/Charts/utils'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { LoadingBubble } from '../loading'
import { AboutContainer, AboutHeader } from './About'
import { TDP_CHART_HEIGHT_PX } from './ChartSection'
import { StatPair, StatWrapper, StatsWrapper } from './StatsSection'
import { Hr } from './shared'

const SWAP_COMPONENT_WIDTH = 360

export const TokenDetailsLayout = styled.div`
  display: flex;
  padding: 0 16px 52px;
  justify-content: center;
  width: 100%;
  gap: 40px;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    padding: 48px 20px;
  }
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.lg}px) {
    flex-direction: column;
    align-items: center;
  }
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.xl}px) {
    gap: 60px;
  }
`

export const LeftPanel = styled.div`
  flex: 1;
  max-width: 780px;
  overflow: hidden;
  width: 100%;
`
export const RightPanel = styled.div`
  display: flex;
  padding-top: 53px;
  flex-direction: column;
  gap: 40px;
  width: ${SWAP_COMPONENT_WIDTH}px;

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.lg}px) {
    width: 100%;
    max-width: 780px;
  }
`

export const TokenInfoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  margin-bottom: 20px;
  gap: 20px;
  ${textFadeIn};
  animation-duration: ${({ theme }) => theme.transition.duration.medium};
`
export const TokenNameCell = styled.div`
  display: flex;
  gap: 12px;
  font-size: 20px;
  line-height: 28px;
  align-items: center;
  padding-top: 4px;
  min-width: 32px;
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    flex-direction: column;
    align-items: flex-start;
  }
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
  height: 36px;
  width: 136px;
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

const Space = styled.div<{ heightSize: number }>`
  height: ${({ heightSize }) => `${heightSize}px`};
`

const loadingFooterTextCss = css`
  color: ${({ theme }) => theme.neutral3};
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  text-decoration: none;
`

const LoadingFooterHeaderContainer = styled(Row)`
  align-items: center;
  ${loadingFooterTextCss}

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    padding: 16px 90px 8px 0;
    position: fixed;
    bottom: 0;
    right: 0;
    justify-content: flex-end;
  }
`

const LoadingFooterHeader = styled.h1`
  ${loadingFooterTextCss}
`

const LoadingFooterLink = styled.a`
  ${loadingFooterTextCss}
  ${ClickableStyle}
`

// exported for testing
export function getLoadingTitle(
  token: Currency | undefined,
  tokenAddress: string,
  chainId: number,
  chainName: string | undefined
): ReactNode {
  let tokenName = ''
  if (token?.name && token?.symbol) {
    tokenName = `${token?.name} (${token?.symbol})`
  } else if (token?.name) {
    tokenName = token?.name
  } else if (token?.symbol) {
    tokenName = token?.symbol
  } else {
    tokenName = tokenAddress || ''
  }
  const chainSuffix = chainName ? ` on ${capitalize(chainName)}` : ''
  const tokenLink = token?.isNative ? (
    tokenName
  ) : (
    <LoadingFooterLink
      href={getExplorerLink(chainId, tokenAddress, ExplorerDataType.TOKEN)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {tokenName}
    </LoadingFooterLink>
  )
  return (
    <Trans>
      token data for {tokenLink}
      {chainSuffix}
    </Trans>
  )
}

export function LoadingChart() {
  return <ChartSkeleton dim type={ChartType.PRICE} height={TDP_CHART_HEIGHT_PX} />
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
function TokenDetailsSkeleton() {
  const { chainName, tokenAddress } = useParams<{ chainName?: string; tokenAddress?: string }>()
  const chainId = supportedChainIdFromGQLChain(validateUrlChainParam(chainName))
  const token = useCurrency(tokenAddress === NATIVE_CHAIN_ID ? 'ETH' : tokenAddress, chainId)

  return (
    <LeftPanel>
      <BreadcrumbNavContainer aria-label="breadcrumb-nav">
        <BreadcrumbNavLink to={`/explore/${chainName}`}>
          <Trans>Explore</Trans> <ChevronRight size={14} />
        </BreadcrumbNavLink>
        <BreadcrumbNavLink to={`/explore/tokens/${chainName}`}>
          <Trans>Tokens</Trans> <ChevronRight size={14} />
        </BreadcrumbNavLink>
        <NavBubble />
      </BreadcrumbNavContainer>
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
      {tokenAddress && (
        <LoadingFooterHeaderContainer gap="xs">
          <Trans>Loading</Trans>
          <LoadingFooterHeader>{getLoadingTitle(token, tokenAddress, chainId, chainName)}</LoadingFooterHeader>
        </LoadingFooterHeaderContainer>
      )}
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
