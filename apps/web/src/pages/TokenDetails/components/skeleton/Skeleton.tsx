import { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { Anchor, type AnchorProps, Flex, Text, TextProps, useMedia } from '@universe/mycelium'
import { styled, type StyledComponent } from '@universe/mycelium/styled'
import { ComponentProps, forwardRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { capitalize } from 'tsafe'
import { Trans } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { zIndexes } from 'ui/src/theme'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from '~/components/BreadcrumbNav'
import { ACTION_BUBBLE_SIZE } from '~/components/StickyCollapsibleHeader/constants'
import { getHeaderLogoSize, getHeaderTitleLineHeight } from '~/components/StickyCollapsibleHeader/getHeaderLogoSize'
import { StickyCollapsibleHeader } from '~/components/StickyCollapsibleHeader/StickyCollapsibleHeader'
import { LoadingBubble } from '~/components/Tokens/loading'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { LoadingChart } from '~/features/Explore/chart/LoadingChart'
import { SwapSkeleton } from '~/features/Swap/SwapSkeleton'
import { useCurrency } from '~/hooks/Tokens'
import { LoadingStats } from '~/pages/TokenDetails/components/info/StatsSection'
import { ClickableTamaguiStyle } from '~/theme/components/styles'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

const TOKEN_DETAILS_LAYOUT_VARIANTS = {
  // The Toucan auction page's shape: it provides its own gutters (no horizontal padding at any
  // width), left-justifies, and tightens the panel gap.
  toucan: { true: 'justify-start gap-[46px] px-[0px] media-xxl:px-[0px] media-lg:px-[0px]', false: '' },
  topSpacing: { '16': 'mt-[16px]', '24': 'mt-[24px]' },
} as const

// No horizontal padding above $xxl — AppBody's 1200px cap provides the page margins there,
// so the TDP body gets the full expected content width
export const TokenDetailsLayout: StyledComponent<typeof Flex, typeof TOKEN_DETAILS_LAYOUT_VARIANTS> = styled(Flex, {
  platform: 'web',
  base: 'flex-row justify-center gap-[80px] mt-[32px] pb-[48px] w-[100%] media-xxl:px-[40px] media-xl:flex-col media-xl:items-center media-xl:gap-[0px] media-lg:px-[20px] media-lg:pt-[0px] media-lg:pb-[52px] media-md:px-[0px]',
  variants: TOKEN_DETAILS_LAYOUT_VARIANTS,
})

const LEFT_PANEL_VARIANTS = {
  // The Toucan auction page clamps the panel (full-width again below $lg).
  clamped: { true: 'max-w-[744px] media-lg:max-w-[100%]', false: '' },
} as const

export const LeftPanel: StyledComponent<typeof Flex, typeof LEFT_PANEL_VARIANTS> = styled(Flex, {
  platform: 'web',
  base: 'grow-[1] shrink-[1] gap-[40px] w-[100%] media-lg:gap-[32px]',
  variants: LEFT_PANEL_VARIANTS,
})

const RIGHT_PANEL_VARIANTS = {
  // The Toucan auction page's aside: narrower (390px), top-aligned, hidden below $xl (its content
  // renders inline in the left column there).
  toucan: { true: 'self-start gap-[24px] w-[390px] media-xl:hidden', false: '' },
} as const

// 360px = the swap component width.
export const RightPanel: StyledComponent<typeof Flex, typeof RIGHT_PANEL_VARIANTS> = styled(Flex, {
  platform: 'web',
  base: 'gap-[40px] w-[360px] media-xl:py-[40px] media-xl:w-[100%] media-xl:max-w-[780px]',
  variants: RIGHT_PANEL_VARIANTS,
})

// The legacy animation:'quick' never animated anything (no style on this row ever changes), so no
// transition is carried over.
const TokenInfoRow = styled(Flex, {
  base: 'flex-row items-center justify-between w-[100%] z-default',
})

const TokenNameCell = styled(Flex, {
  base: 'flex-row items-center gap-[12px] grow-[1] shrink min-w-[32px]',
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
  const size = getHeaderLogoSize({ isCompact, media, scaleMobileOnScroll: true })
  return <DetailBubble width={size} height={size} round containerProps={{ maxWidth: size }} {...props} />
}

function TitleBubble({ isCompact, ...props }: LoadingBubbleProps & { isCompact: boolean }) {
  const media = useMedia()
  const lineHeight = getHeaderTitleLineHeight({ isCompact, media })
  return <DetailBubble height={lineHeight} width={136} containerProps={{ width: 'max-content' }} {...props} />
}

function SectionBubble(props: LoadingBubbleProps) {
  return <SquaredBubble width={120} {...props} />
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

const ExtraDetailsContainer = styled(Flex, {
  base: 'flex-row pt-[24px]',
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
  platform: 'web',
  base: 'flex-row items-center justify-end pt-[16px] pb-[8px] pl-[0px] pr-[90px] right-[0px] bottom-[0px] fixed media-xl:justify-center media-xl:pr-[0px] media-xl:w-[100%]',
})

// forwardRef is load-bearing: react-i18next's <Trans> keeps a mapped component's own children only
// for exotic element types — a plain function component gets its children replaced by the (empty)
// `<tokenLink />` translation node.
const LoadingFooterLink = forwardRef<HTMLElement, AnchorProps>(function LoadingFooterLink(props, ref) {
  return <Anchor ref={ref} fontFamily="$body" {...loadingFooterTextStyle} {...ClickableTamaguiStyle} {...props} />
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

      <Flex gap="$gap16" py="$spacing24">
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
  platform: 'web',
  base: 'pt-[48px] w-[100%] media-xxl:px-[40px] media-lg:px-[20px] media-md:px-[0px]',
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
            {t('common.token.plural')} <ChevronRight />
          </BreadcrumbNavLink>
          <NavBubble />
        </BreadcrumbNavContainer>
      </BreadcrumbWrapper>
      <StickyCollapsibleHeader isCompact={isCompact} px="$none" $xxl={{ px: '$spacing40' }}>
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
      </StickyCollapsibleHeader>
      <TokenDetailsLayout>
        <LeftPanel>
          <TokenDetailsSkeleton />
        </LeftPanel>
        <RightPanel>
          <SwapSkeleton />
        </RightPanel>
      </TokenDetailsLayout>
    </>
  )
}
