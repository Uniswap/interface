import type { EVMUniverseChainId } from '@universe/chains'
import { DynamicConfigs, useDynamicConfigValue, VerifiedAuctionsConfigKey } from '@universe/gating'
import { Flex, Text } from '@universe/mycelium'
import { CheckmarkCircle } from '@universe/mycelium/icons/CheckmarkCircle'
import { Fire } from '@universe/mycelium/icons/Fire'
import { Lock } from '@universe/mycelium/icons/Lock'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { useIsDarkMode, useMedia, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { Fragment, memo, ReactNode, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useTokenWarningCardText } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { shortenAddress } from 'utilities/src/addresses'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from '~/components/BreadcrumbNav'
import { DetailsHeaderSubtitleMobile } from '~/components/StickyCollapsibleHeader/DetailsHeaderSubtitleMobile'
import { DetailsHeaderTitle } from '~/components/StickyCollapsibleHeader/DetailsHeaderTitle'
import { HeaderDivider } from '~/components/StickyCollapsibleHeader/HeaderDivider'
import { CarouselEdgeFade } from '~/components/TokenCardCarousel/CarouselEdgeFade'
import { CAROUSEL_FADE_WIDTH_SMALL } from '~/components/TokenCardCarousel/constants'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { getTokenDetailsURL } from '~/data/util'
import { useAuctionLiquidityLock } from '~/features/Toucan/Auction/hooks/useAuctionLiquidityLock'
import { useAuctionRedemption } from '~/features/Toucan/Auction/hooks/useAuctionRedemption'
import { useIsQuickLaunchAuction } from '~/features/Toucan/Auction/hooks/useIsQuickLaunchAuction'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { PoolsTradeBadge } from '~/features/Toucan/Shared/PoolsTradeBadge'
import {
  getAuctionTokenWarningSeverity,
  shouldShowAuctionTokenWarning,
} from '~/features/Toucan/utils/auctionTokenProtection'
import { isPoolsSupportedChain } from '~/features/Toucan/utils/quickLaunchLinks'
import { useWheelHorizontalScroll } from '~/pages/Explore/categories/useWheelHorizontalScroll'
import { TokenDetailsHeaderAddressCopyMobile } from '~/pages/TokenDetails/components/header/TokenDetailsHeaderAddressCopyMobile'
import { usePrefetchTokenDetailsAuction } from '~/pages/TokenDetails/hooks/usePrefetchTokenDetailsAuction'

/** Auction tokens are single-chain, so the shared mobile copy affordance never shows a per-network list. */
const NO_MULTICHAIN_ENTRIES: MultichainTokenEntry[] = []

// TODO | Toucan - Investigate why BreadcrumbNavLink doesn't re-render on theme change in this component tree.
// The same component works correctly in PoolDetailsHeader.tsx. This memo + useIsDarkMode is a workaround
// to force re-renders when theme changes
const AuctionBreadcrumbs = memo(function AuctionBreadcrumbs({ symbol, address }: { symbol: string; address: string }) {
  const { t } = useTranslation()
  useIsDarkMode()

  return (
    <BreadcrumbNavContainer aria-label="breadcrumb-nav">
      <BreadcrumbNavLink to="/explore">
        {t('common.explore')} <RotatableChevron direction="right" size="$icon.16" />
      </BreadcrumbNavLink>
      <BreadcrumbNavLink to="/explore/auctions">
        {t('toucan.auctions')} <RotatableChevron direction="right" size="$icon.16" />
      </BreadcrumbNavLink>
      <CurrentPageBreadcrumb address={address} poolName={symbol} />
    </BreadcrumbNavContainer>
  )
})

const MetadataChip = ({ icon, label, tooltip }: { icon: ReactNode; label: string; tooltip?: ReactNode }) => {
  const chip = (
    <Flex
      row
      alignItems="center"
      gap="$spacing4"
      // As a flex child of the scroller the chip would otherwise sit at min-content width and wrap its
      // label onto two lines inside the pill; unshrinkable keeps the label on one line and the row just
      // scrolls further.
      flexShrink={0}
      backgroundColor="$surface3"
      borderRadius="$rounded12"
      paddingHorizontal="$spacing8"
      paddingVertical="$spacing2"
    >
      {icon}
      {/* Hard rule: a badge label never wraps. nowrap also raises the chip's min-content width to the
          full label, so the row scrolls past it instead of squeezing it onto a second line. */}
      <Text variant="body4" color="$neutral1" whiteSpace="nowrap">
        {label}
      </Text>
    </Flex>
  )

  if (!tooltip) {
    return chip
  }

  return (
    <MouseoverTooltip placement="top" size={TooltipSize.Small} text={tooltip}>
      {chip}
    </MouseoverTooltip>
  )
}

const AuctionNetworkItem = ({ chainId }: { chainId: EVMUniverseChainId }) => (
  <Flex row alignItems="center" gap="$spacing6" flexShrink={0}>
    <NetworkLogo chainId={chainId} size={16} />
    <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
      {getChainInfo(chainId).label}
    </Text>
  </Flex>
)

const AuctionAddressItem = ({ address }: { address: string }) => (
  <CopyHelper
    toCopy={address}
    iconPosition="right"
    iconSize={16}
    iconColor="$neutral2"
    color="$neutral2"
    alwaysShowIcon
  >
    <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
      {shortenAddress({ address, chars: 4 })}
    </Text>
  </CopyHelper>
)

const BuybackTooltip = ({
  hasBurnedTokens,
  burnedAmountFormatted,
  burnedUsdFormatted,
}: {
  hasBurnedTokens: boolean
  burnedAmountFormatted: string | undefined
  burnedUsdFormatted: string | undefined
}) => {
  const { t } = useTranslation()

  if (!hasBurnedTokens || !burnedAmountFormatted) {
    return <>{t('toucan.auction.header.buyback.tooltip.none')}</>
  }

  return (
    <Flex gap="$gap4">
      <Text variant="body4" color="$neutral1">
        {t('toucan.auction.header.buyback.tooltip.burned', { amount: burnedAmountFormatted })}
      </Text>
      {burnedUsdFormatted && (
        <Text variant="body4" color="$neutral2">
          {t('toucan.auction.header.buyback.tooltip.usd', { usdValue: burnedUsdFormatted })}
        </Text>
      )}
    </Flex>
  )
}

/**
 * Metadata row under the token name: network, contract address with copy action, and
 * conditional liquidity-lock / buyback-burn chips. The lock chips render only when the lock
 * data exists on the auction (see useAuctionLiquidityLock) so the row degrades to
 * network + address until the backend serves lock info.
 *
 * On mobile web the row narrows to the badges alone: the logo's chain badge names the network and
 * the copy icon beside the token name carries the contract address, exactly as TDP does there. The
 * ticker joins them there as `tickerItem`, taking the row's first slot so it shares the badges' line
 * and their scroll/fade treatment instead of occupying a line of its own.
 */
const AuctionHeaderMetadataRow = ({ tickerItem }: { tickerItem?: ReactNode }) => {
  const { t } = useTranslation()
  const media = useMedia()
  const colors = useSporeColors()
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  const { scrollerRef, showRightFade } = useWheelHorizontalScroll()
  const {
    isLocked,
    isPermanentlyLocked,
    isBuybackEnabled,
    unlockDateFormatted,
    hasBurnedTokens,
    burnedAmountFormatted,
    burnedUsdFormatted,
  } = useAuctionLiquidityLock()

  if (!auctionDetails) {
    return null
  }

  const lockedLiquidityTooltip = isPermanentlyLocked
    ? t('toucan.auction.header.lockedLiquidity.tooltip.forever')
    : unlockDateFormatted
      ? t('toucan.auction.header.lockedLiquidity.tooltip', { date: unlockDateFormatted })
      : undefined

  const items: { key: string; node: ReactNode }[] = []

  if (tickerItem) {
    items.push({ key: 'ticker', node: tickerItem })
  }

  if (!media.sm) {
    items.push({ key: 'network', node: <AuctionNetworkItem chainId={auctionDetails.chainId} /> })
    items.push({ key: 'address', node: <AuctionAddressItem address={auctionDetails.tokenAddress} /> })
  }

  if (isLocked) {
    items.push({
      key: 'locked',
      node: (
        <MetadataChip
          icon={<Lock size="$icon.12" color="$statusSuccess" />}
          label={t('toucan.auction.header.lockedLiquidity')}
          tooltip={lockedLiquidityTooltip}
        />
      ),
    })
  }

  if (isBuybackEnabled) {
    items.push({
      key: 'buyback',
      node: (
        <MetadataChip
          icon={<Fire size="$icon.12" color="$statusCritical" />}
          label={t('toucan.auction.header.buybackEnabled')}
          tooltip={
            <BuybackTooltip
              hasBurnedTokens={hasBurnedTokens}
              burnedAmountFormatted={burnedAmountFormatted}
              burnedUsdFormatted={burnedUsdFormatted}
            />
          }
        />
      ),
    })
  }

  if (items.length === 0) {
    return null
  }

  return (
    /*
     * Horizontal carousel, same treatment as the token card carousels: the row scrolls instead of
     * wrapping, so the badges never shrink and never land on a second line, and a right-edge
     * CarouselEdgeFade hints at the content still off-screen. Making the row a scroll container is
     * also what lets it be narrower than its content — a flex item that scrolls has an automatic
     * minimum size of 0, where a nowrap row is floored at its min-content width and overflows the
     * header instead. useWheelHorizontalScroll adds vertical-wheel support for plain mice.
     * The shared column collapses its gap at $md, so add the separation back for the mweb stack.
     */
    <Flex position="relative" maxWidth="100%" minWidth={0} flexShrink={1} $sm={{ mt: '$spacing2' }}>
      <Flex
        ref={scrollerRef}
        row
        alignItems="center"
        gap="$spacing6"
        className="scrollbar-hidden"
        $platform-web={{ overflowX: 'auto', overscrollBehaviorX: 'none' }}
      >
        {items.map(({ key, node }, index) => (
          <Fragment key={key}>
            {index > 0 && <HeaderDivider alignSelf="stretch" />}
            {node}
          </Fragment>
        ))}
      </Flex>
      {showRightFade && (
        <CarouselEdgeFade
          side="right"
          fadeWidth={CAROUSEL_FADE_WIDTH_SMALL}
          surfaceColor={colors.surface1.val}
          opacity={1}
        />
      )}
    </Flex>
  )
}

/** Auction-specific icons rendered inline after the ticker: token-protection warning, verified / quick-launch. */
const AuctionTitleAdornments = ({
  token,
  verified,
  isQuickLaunch,
}: {
  token?: CurrencyInfo
  verified: boolean
  isQuickLaunch: boolean
}) => {
  // Token-protection warning icon stays on for every auction, including quick launches: the
  // quick-launch flag is forgeable, so it must not gate a protection signal (exemption policy
  // deferred to security review, LP-1076).
  const severity = getAuctionTokenWarningSeverity(token)
  const { heading: warningHeading, description: warningDescription } = useTokenWarningCardText(token)
  const showWarning = shouldShowAuctionTokenWarning(token)

  if (!showWarning && !verified && !isQuickLaunch) {
    return null
  }

  return (
    <Flex row alignItems="center" gap="$gap4" alignSelf="center">
      {showWarning && (
        <MouseoverTooltip
          placement="top"
          size={TooltipSize.Small}
          disabled={!warningHeading && !warningDescription}
          text={
            <Flex gap="$gap4">
              {warningHeading && (
                <Text variant="body4" color="$neutral1">
                  {warningHeading}
                </Text>
              )}
              {warningDescription && (
                <Text variant="body4" color="$neutral2" lineHeight={16}>
                  {warningDescription}
                </Text>
              )}
            </Flex>
          }
        >
          <WarningIcon size="$icon.16" severity={severity} />
        </MouseoverTooltip>
      )}
      {verified && <CheckmarkCircle size="$icon.16" color="$accent1" />}
      {/* QuickLaunch: pools.trade logo in the verified-icon slot; curated verified wins when both apply. */}
      {!verified && isQuickLaunch && <PoolsTradeBadge />}
    </Flex>
  )
}

const AuctionTokenInfo = ({
  name,
  symbol,
  logoUrl,
  chainId,
  tokenAddress,
  verified,
  tokenDetailsUrl,
  token,
  isCompact,
  isQuickLaunch,
}: {
  name: string
  symbol: string
  logoUrl: string
  chainId: EVMUniverseChainId
  tokenAddress: string
  verified: boolean
  tokenDetailsUrl?: string
  token?: CurrencyInfo
  isCompact: boolean
  isQuickLaunch: boolean
}) => {
  const media = useMedia()
  const ticker = <DetailsHeaderSubtitleMobile symbol={symbol} isCompact={isCompact} />
  // On mweb the ticker rides in the metadata row's first slot, sharing one line with the badges and
  // their scroller/fade rather than taking a line of its own. It falls back to the subtitle slot
  // wherever that row isn't rendered — the compact header drops it.
  const hasMetadataRow = !isCompact
  const tickerInMetadataRow = media.sm && hasMetadataRow

  return (
    <DetailsHeaderTitle
      name={name}
      symbol={symbol}
      isCompact={isCompact}
      logoUrl={logoUrl}
      logoName={name}
      logoSymbol={symbol}
      chainId={chainId}
      // The metadata row names the network itself above $sm, so the badge only stands in below it —
      // and back at any width once the row is gone, which is what the compact header does. The ticker
      // joining that row on mweb doesn't change this: the row still names no network there.
      showLogoNetworkBadgeOnMobileOnly
      titleHref={tokenDetailsUrl}
      // Auction token names can come back empty; without a floor the h1 collapses and the header looks broken.
      titleMinWidth={40}
      titleAdornments={
        <>
          {/* Mirrors TDP's mweb header: the address copy affordance sits inline after the name. */}
          <TokenDetailsHeaderAddressCopyMobile
            displayAddress={tokenAddress}
            isNative={false}
            chainId={chainId}
            isMultiChainAsset={false}
            selectedChainId={undefined}
            multichainEntries={NO_MULTICHAIN_ENTRIES}
          />
          <AuctionTitleAdornments token={token} verified={verified} isQuickLaunch={isQuickLaunch} />
        </>
      }
      mobileSubtitle={tickerInMetadataRow ? undefined : ticker}
      metadataRow={
        hasMetadataRow ? <AuctionHeaderMetadataRow tickerItem={tickerInMetadataRow ? ticker : undefined} /> : undefined
      }
      // The row still carries the ticker and the liquidity-lock / buyback badges on mweb, where TDP has
      // nothing to show.
      showMetadataRowOnMobile
      // The metadata row is a horizontal scroller, so the column has to be allowed to be narrower than it.
      shrinkTitleColumn
    />
  )
}

export const AuctionHeader = ({ isCompact = false }: { isCompact?: boolean }) => {
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  const prefetchAuction = usePrefetchTokenDetailsAuction()
  // For redeemable virtual-token auctions, link the token name/logo to the real token — consistent
  // with the token-launched banner (both resolve through useAuctionRedemption).
  const { isRedeemable, realTokenAddress } = useAuctionRedemption()

  const verifiedAuctionIds: string[] = useDynamicConfigValue({
    config: DynamicConfigs.VerifiedAuctions,
    key: VerifiedAuctionsConfigKey.VerifiedAuctionIds,
    defaultValue: [],
  })

  const verified = useMemo(() => {
    if (!auctionDetails?.auctionId) {
      return false
    }
    return verifiedAuctionIds.includes(auctionDetails.auctionId)
  }, [auctionDetails?.auctionId, verifiedAuctionIds])

  // Off a pools.xyz-served chain the brand attribution would be false provenance.
  const isQuickLaunch = useIsQuickLaunchAuction() && isPoolsSupportedChain(auctionDetails?.chainId)

  // Get the token details URL
  const tokenDetailsUrl = useMemo(() => {
    if (!auctionDetails) {
      return undefined
    }
    const chainInfo = getChainInfo(auctionDetails.chainId)
    return getTokenDetailsURL({
      address: isRedeemable && realTokenAddress ? realTokenAddress : auctionDetails.tokenAddress,
      chainUrlParam: chainInfo.urlParam,
    })
  }, [auctionDetails, isRedeemable, realTokenAddress])
  const prefetchTokenDetails = useCallback(() => {
    if (auctionDetails) {
      prefetchAuction({
        chainId: auctionDetails.chainId,
        tokenAddress: isRedeemable && realTokenAddress ? realTokenAddress : auctionDetails.tokenAddress,
      })
    }
  }, [auctionDetails, isRedeemable, prefetchAuction, realTokenAddress])

  if (!auctionDetails) {
    return null
  }

  const tokenSymbol = auctionDetails.token?.currency.symbol ?? auctionDetails.tokenSymbol
  const tokenName = auctionDetails.token?.currency.name ?? ''
  // token.logoUrl already falls back to the API-provided token image (see
  // useLoadAuctionDetails); reading tokenImageUrl here too covers the case where
  // token info couldn't be constructed at all.
  const logoUrl = auctionDetails.token?.logoUrl ?? auctionDetails.tokenImageUrl ?? ''

  return (
    <Flex
      gap="$gap8"
      onMouseEnter={prefetchTokenDetails}
      onFocus={prefetchTokenDetails}
      onPointerDown={prefetchTokenDetails}
    >
      {!isCompact && <AuctionBreadcrumbs symbol={tokenSymbol} address={auctionDetails.tokenAddress} />}
      <AuctionTokenInfo
        name={tokenName}
        symbol={tokenSymbol}
        logoUrl={logoUrl}
        chainId={auctionDetails.chainId}
        tokenAddress={auctionDetails.tokenAddress}
        verified={verified}
        tokenDetailsUrl={tokenDetailsUrl}
        token={auctionDetails.token}
        isCompact={isCompact}
        isQuickLaunch={isQuickLaunch}
      />
    </Flex>
  )
}
