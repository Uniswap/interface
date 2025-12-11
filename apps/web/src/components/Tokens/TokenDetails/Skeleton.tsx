import { Currency } from '@uniswap/sdk-core'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { ChartSkeleton } from 'components/Charts/LoadingState'
import { ChartType } from 'components/Charts/utils'
import { SwapSkeleton } from 'components/swap/SwapSkeleton'
import { LoadingBubble } from 'components/Tokens/loading'
import { AboutContainer, AboutHeader } from 'components/Tokens/TokenDetails/About'
import { TDP_CHART_HEIGHT_PX } from 'components/Tokens/TokenDetails/ChartSection'
import { StatPair, StatsWrapper, StatWrapper } from 'components/Tokens/TokenDetails/StatsSection'
import { Hr } from 'components/Tokens/TokenDetails/shared'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCurrency } from 'hooks/Tokens'
import { deprecatedStyled } from 'lib/styled-components'
import { ReactNode } from 'react'
import { ChevronRight } from 'react-feather'
import { Trans } from 'react-i18next'
import { useParams } from 'react-router'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { capitalize } from 'tsafe'
import { Anchor, Flex, styled, Text, TextProps } from 'ui/src'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { useChainIdFromUrlParam } from 'utils/chainParams'

const SWAP_COMPONENT_WIDTH = 360

export const TokenDetailsLayout = styled(Flex, {
  row: true,
  justifyContent: 'center',
  width: '100%',
  gap: 80,
  py: '$spacing48',
  px: '$spacing40',

  $sm: {
    gap: 0,
  },
  $lg: {
    pt: 0,
    px: '$padding20',
    pb: 52,
  },
  $xl: {
    flexDirection: 'column',
    alignItems: 'center',
  },
})

export const LeftPanel = styled(Flex, {
  maxWidth: 780,
  overflow: 'hidden',
  width: '100%',
  flexGrow: 1,
  flexShrink: 1,
})

export const RightPanel = styled(Flex, {
  pt: 53,
  gap: 40,
  width: SWAP_COMPONENT_WIDTH,

  $xl: {
    width: '100%',
    maxWidth: 780,
  },
})

const TokenInfoContainer = styled(Flex, {
  row: true,
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '$gap20',
  pt: '$padding8',
  mb: '$spacing20',
  animation: 'quick',
  zIndex: '$default',
})

const TokenNameCell = styled(Flex, {
  row: true,
  gap: '$gap12',
  alignItems: 'center',
  pt: '$spacing4',
  minWidth: 32,
  $md: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
})

/* Loading state bubbles */
const DetailBubble = deprecatedStyled(LoadingBubble)`
  height: 16px;
  width: 180px;
`

const SquaredBubble = deprecatedStyled(DetailBubble)`
  height: 32px;
  border-radius: 8px;
`

const NavBubble = deprecatedStyled(DetailBubble)`
  width: 169px;
`

const TokenLogoBubble = deprecatedStyled(DetailBubble)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
`
const TitleBubble = deprecatedStyled(DetailBubble)`
  height: 36px;
  width: 136px;
`

const SectionBubble = deprecatedStyled(SquaredBubble)`
  width: 120px;
`
const StatTitleBubble = deprecatedStyled(DetailBubble)`
  width: 80px;
  margin-bottom: 4px;
`

const StatBubble = deprecatedStyled(SquaredBubble)`
  width: 116px;
`
const WideBubble = deprecatedStyled(DetailBubble)`
  margin-bottom: 6px;
  width: 100%;
`

const ThinTitleBubble = deprecatedStyled(WideBubble)`
  width: 120px;
`

const HalfWideBubble = deprecatedStyled(WideBubble)`
  width: 50%;
`

const StatsLoadingContainer = styled(Flex, {
  row: true,
  flexWrap: 'wrap',
  width: '100%',
})

const ExtraDetailsContainer = styled(Flex, {
  row: true,
  pt: '$spacing24',
})

const loadingFooterTextStyle = {
  color: '$neutral3',
  fontSize: 12,
  fontWeight: '500',
  lineHeight: 16,
  '$platform-web': {
    textDecoration: 'none',
  },
} satisfies TextProps

const LoadingFooterHeaderContainer = styled(Flex, {
  row: true,
  alignItems: 'center',
  pt: '$padding16',
  pr: 90,
  pb: '$padding8',
  pl: 0,
  bottom: 0,
  right: 0,
  justifyContent: 'flex-end',
  ...loadingFooterTextStyle,

  '$platform-web': {
    position: 'fixed',
  },
  $lg: {
    p: 'unset',
    position: 'unset',
    bottom: 'unset',
    right: 'unset',
    justifyContent: 'unset',
  },
})

const LoadingFooterHeader = styled(Text, {
  variant: 'heading1',
  ...loadingFooterTextStyle,
})

const LoadingFooterLink = styled(Anchor, {
  fontFamily: '$body',
  ...loadingFooterTextStyle,
  ...ClickableTamaguiStyle,
})

// exported for testing
export function getLoadingTitle({
  token,
  tokenAddress,
  chainId,
  chainName,
}: {
  token?: Currency
  tokenAddress: string
  chainId: number
  chainName?: string
}): ReactNode {
  let tokenName = ''
  if (token?.name && token.symbol) {
    tokenName = `${token.name} (${token.symbol})`
  } else if (token?.name) {
    tokenName = token.name
  } else if (token?.symbol) {
    tokenName = token.symbol
  } else {
    tokenName = tokenAddress || ''
  }
  const tokenLink = token?.isNative ? (
    <>{tokenName}</>
  ) : (
    <LoadingFooterLink
      href={getExplorerLink({ chainId, data: tokenAddress, type: ExplorerDataType.TOKEN })}
      target="_blank"
      rel="noopener noreferrer"
    >
      {tokenName}
    </LoadingFooterLink>
  )
  return chainName ? (
    <Trans
      i18nKey="tdp.loading.title.withChain"
      values={{ chainName: capitalize(chainName) }}
      components={{ tokenLink }}
    />
  ) : (
    <Trans i18nKey="tdp.loading.title.default" components={{ tokenLink }} />
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
  const { id: chainId, urlParam } = getChainInfo(useChainIdFromUrlParam() ?? UniverseChainId.Mainnet)
  const { tokenAddress } = useParams<{ tokenAddress?: string }>()
  const token = useCurrency({
    address: tokenAddress === NATIVE_CHAIN_ID ? 'ETH' : tokenAddress,
    chainId,
  })

  return (
    <LeftPanel>
      <BreadcrumbNavContainer aria-label="breadcrumb-nav">
        <BreadcrumbNavLink to={`/explore/${urlParam}`}>
          <Trans i18nKey="common.explore" /> <ChevronRight size={14} />
        </BreadcrumbNavLink>
        <BreadcrumbNavLink to={`/explore/tokens/${urlParam}`}>
          <Trans i18nKey="common.tokens" /> <ChevronRight size={14} />
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

      <Flex row height={4} />
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
          <Trans i18nKey="common.loading" />
          <LoadingFooterHeader>
            {getLoadingTitle({ token, tokenAddress, chainId, chainName: urlParam })}
          </LoadingFooterHeader>
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
