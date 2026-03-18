import { Currency } from '@uniswap/sdk-core'
import { ComponentProps, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { capitalize } from 'tsafe'
import { Anchor, Flex, styled, Text, TextProps, useMedia } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { zIndexes } from 'ui/src/theme'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from '~/components/BreadcrumbNav'
import { LoadingChart } from '~/components/Explore/chart/LoadingChart'
import { ACTION_BUBBLE_SIZE } from '~/components/Explore/stickyHeader/constants'
import { DetailsHeaderContainer } from '~/components/Explore/stickyHeader/DetailsHeaderContainer'
import { getHeaderLogoSize, getHeaderTitleLineHeight } from '~/components/Explore/stickyHeader/getHeaderLogoSize'
import { SwapSkeleton } from '~/components/swap/SwapSkeleton'
import { LoadingBubble } from '~/components/Tokens/loading'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useCurrency } from '~/hooks/Tokens'
import { StatsWrapper, StatWrapper } from '~/pages/TokenDetails/components/info/StatsSection'
import { ClickableTamaguiStyle } from '~/theme/components/styles'
import { useChainIdFromUrlParam } from '~/utils/chainParams'

const SWAP_COMPONENT_WIDTH = 360

export const TokenDetailsLayout = styled(Flex, {
  row: true,
  justifyContent: 'center',
  width: '100%',
  gap: 80,
  mt: '$spacing32',
  pb: '$spacing48',
  px: '$spacing40',

  $lg: {
    pt: 0,
    px: '$padding20',
    pb: 52,
  },
  $xl: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: '$none',
  },
})

export const LeftPanel = styled(Flex, {
  width: '100%',
  flexGrow: 1,
  flexShrink: 1,
})

export const RightPanel = styled(Flex, {
  gap: 40,
  width: SWAP_COMPONENT_WIDTH,

  $xl: {
    width: '100%',
    maxWidth: 780,
  },
})

const TokenInfoRow = styled(Flex, {
  row: true,
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  animation: 'quick',
  zIndex: '$default',
})

const TokenNameCell = styled(Flex, {
  row: true,
  flex: 1,
  gap: '$gap12',
  alignItems: 'center',
  minWidth: 32,
})

/* Loading state bubbles */
type LoadingBubbleProps = ComponentProps<typeof LoadingBubble>

function DetailBubble(props: LoadingBubbleProps) {
  return <LoadingBubble height={16} width={180} {...props} />
}

function SquaredBubble(props: LoadingBubbleProps) {
  return <DetailBubble height={32} skeletonProps={{ borderRadius: '$rounded8' }} {...props} />
}

function NavBubble(props: LoadingBubbleProps) {
  return <DetailBubble width={169} {...props} />
}

function TokenLogoBubble({ isCompact, ...props }: LoadingBubbleProps & { isCompact: boolean }) {
  const media = useMedia()
  const size = getHeaderLogoSize({ isCompact, isMobile: media.md })
  return <DetailBubble width={size} height={size} round containerProps={{ maxWidth: size }} {...props} />
}

function TitleBubble({ isCompact, ...props }: LoadingBubbleProps & { isCompact: boolean }) {
  const media = useMedia()
  const lineHeight = getHeaderTitleLineHeight({ isCompact, isMobile: media.md })
  return <DetailBubble height={lineHeight} width={136} containerProps={{ width: 'max-content' }} {...props} />
}

function SectionBubble(props: LoadingBubbleProps) {
  return <SquaredBubble width={120} {...props} />
}

function StatTitleBubble(props: LoadingBubbleProps) {
  return <DetailBubble width={80} containerProps={{ mb: '$spacing4' }} {...props} />
}

function StatBubble(props: LoadingBubbleProps) {
  return <SquaredBubble width={116} {...props} />
}

function WideBubble(props: LoadingBubbleProps) {
  return <DetailBubble width="100%" containerProps={{ mb: '$spacing6' }} {...props} />
}

function ThinTitleBubble(props: LoadingBubbleProps) {
  return <WideBubble width={120} {...props} />
}

function HalfWideBubble(props: LoadingBubbleProps) {
  return <WideBubble width="50%" {...props} />
}

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
  '$platform-web': {
    position: 'fixed',
  },
  $xl: {
    pr: '$none',
    width: '100%',
    justifyContent: 'center',
  },
})

const LoadingFooterLink = styled(Anchor, {
  fontFamily: '$body',
  ...loadingFooterTextStyle,
  ...ClickableTamaguiStyle,
})

// exported for testing
export function LoadingTitle({
  token,
  chainId,
  chainName,
}: {
  token?: Currency
  chainId: number
  chainName?: string
}): JSX.Element {
  const tokenName = useMemo(() => {
    if (token?.name && token.symbol) {
      return `${token.name} (${token.symbol})`
    } else if (token?.name) {
      return token.name
    } else if (token?.symbol) {
      return token.symbol
    } else {
      return token && !token.isNative ? token.address : ''
    }
  }, [token])

  const tokenLink = token?.isNative ? (
    <>{tokenName}</>
  ) : (
    <LoadingFooterLink
      href={getExplorerLink({ chainId, data: token?.address, type: ExplorerDataType.TOKEN })}
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

function LoadingStats() {
  return (
    <StatsWrapper>
      <SectionBubble />
      <StatsLoadingContainer>
        <StatWrapper>
          <StatTitleBubble />
          <StatBubble />
        </StatWrapper>
        <StatWrapper>
          <StatTitleBubble />
          <StatBubble />
        </StatWrapper>
        <StatWrapper>
          <StatTitleBubble />
          <StatBubble />
        </StatWrapper>
        <StatWrapper>
          <StatTitleBubble />
          <StatBubble />
        </StatWrapper>
        <StatWrapper>
          <StatTitleBubble />
          <StatBubble />
        </StatWrapper>
        <StatWrapper>
          <StatTitleBubble />
          <StatBubble />
        </StatWrapper>
      </StatsLoadingContainer>
    </StatsWrapper>
  )
}

const ChevronRight = (): JSX.Element => <RotatableChevron direction="right" size="$icon.16" />

/* Loading State: row component with loading bubbles */
function TokenDetailsSkeleton() {
  const { t } = useTranslation()
  const { id: chainId, urlParam } = getChainInfo(useChainIdFromUrlParam() ?? UniverseChainId.Mainnet)
  const { tokenAddress } = useParams<{ tokenAddress?: string }>()
  const token = useCurrency({
    address: tokenAddress === NATIVE_CHAIN_ID ? 'ETH' : tokenAddress,
    chainId,
  })

  return (
    <>
      <LoadingChart />

      <Flex height="$spacing40" />

      <LoadingStats />

      <Flex height="$spacing40" />

      <Flex gap="$gap16" py="$spacing24" animation="quick">
        <Text variant="heading2">
          <SectionBubble />
        </Text>
      </Flex>
      <WideBubble />
      <WideBubble />
      <HalfWideBubble containerProps={{ mb: '$spacing24' }} />
      <ExtraDetailsContainer>
        <ThinTitleBubble />
        <HalfWideBubble />
      </ExtraDetailsContainer>
      <ExtraDetailsContainer>
        <ThinTitleBubble />
        <HalfWideBubble />
      </ExtraDetailsContainer>
      {tokenAddress && (
        <Flex position="relative" width="100%" zIndex={zIndexes.mask}>
          <LoadingFooterHeaderContainer gap="$gap4" width="100%">
            <Text {...loadingFooterTextStyle}>{t('common.loading')}</Text>
            <Text variant="heading1" {...loadingFooterTextStyle}>
              <LoadingTitle token={token} chainId={chainId} chainName={urlParam} />
            </Text>
          </LoadingFooterHeaderContainer>
        </Flex>
      )}
    </>
  )
}

const BreadcrumbWrapper = styled(Flex, {
  width: '100%',
  px: '$spacing40',
  pt: '$spacing48',
  $lg: { px: '$padding20' },
})

export function TokenDetailsPageSkeleton({ isCompact }: { isCompact: boolean }) {
  const { t } = useTranslation()
  const media = useMedia()
  const { urlParam } = getChainInfo(useChainIdFromUrlParam() ?? UniverseChainId.Mainnet)

  return (
    <>
      <BreadcrumbWrapper>
        <BreadcrumbNavContainer aria-label="breadcrumb-nav">
          <BreadcrumbNavLink to={`/explore/tokens/${urlParam}`}>
            {t('common.tokens')} <ChevronRight />
          </BreadcrumbNavLink>
          <NavBubble />
        </BreadcrumbNavContainer>
      </BreadcrumbWrapper>
      <DetailsHeaderContainer isCompact={isCompact}>
        <TokenInfoRow>
          <TokenNameCell>
            <TokenLogoBubble isCompact={isCompact} />
            <Flex gap="$gap8">
              <Flex row gap="$gap8" alignItems="flex-end" $sm={{ width: '100%' }}>
                <TitleBubble isCompact={isCompact} />
              </Flex>
              <DetailBubble height={16} width={120} />
            </Flex>
          </TokenNameCell>
          <Flex row gap="$gap8" justifyContent="center">
            <DetailBubble
              width={ACTION_BUBBLE_SIZE.width}
              height={ACTION_BUBBLE_SIZE.height}
              round
              containerProps={{ maxWidth: ACTION_BUBBLE_SIZE.width }}
            />
            {!media.sm && (
              <DetailBubble
                width={ACTION_BUBBLE_SIZE.width}
                height={ACTION_BUBBLE_SIZE.height}
                round
                containerProps={{ maxWidth: ACTION_BUBBLE_SIZE.width }}
              />
            )}
          </Flex>
        </TokenInfoRow>
      </DetailsHeaderContainer>
      <TokenDetailsLayout>
        <LeftPanel gap="$spacing40" $lg={{ gap: '$gap32' }}>
          <TokenDetailsSkeleton />
        </LeftPanel>
        <RightPanel>
          <SwapSkeleton />
        </RightPanel>
      </TokenDetailsLayout>
    </>
  )
}
