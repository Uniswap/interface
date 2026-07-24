import { DynamicConfigs, useDynamicConfigValue, VerifiedAuctionsConfigKey } from '@universe/gating'
import { memo, ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Flex, Text, useIsDarkMode, useMedia } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { Fire } from 'ui/src/components/icons/Fire'
import { Lightning } from 'ui/src/components/icons/Lightning'
import { Lock } from 'ui/src/components/icons/Lock'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getTokenWarningSeverity, useTokenWarningCardText } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { shortenAddress } from 'utilities/src/addresses'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from '~/components/BreadcrumbNav'
import { HEADER_TRANSITION } from '~/components/StickyCollapsibleHeader/constants'
import { getHeaderLogoSize, getHeaderTitleVariant } from '~/components/StickyCollapsibleHeader/getHeaderLogoSize'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { useAuctionLiquidityLock } from '~/features/Toucan/Auction/hooks/useAuctionLiquidityLock'
import { useAuctionRedemption } from '~/features/Toucan/Auction/hooks/useAuctionRedemption'
import { useIsQuickLaunchAuction } from '~/features/Toucan/Auction/hooks/useIsQuickLaunchAuction'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { LiquidityLockedBadge } from '~/features/Toucan/Shared/LiquidityLockedBadge'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

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
      backgroundColor="$surface3"
      borderRadius="$rounded12"
      paddingHorizontal="$spacing8"
      paddingVertical="$spacing2"
    >
      {icon}
      <Text variant="body4" color="$neutral1">
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

/**
 * Metadata row under the token name: network, contract address with copy action, and
 * conditional liquidity-lock / buyback-burn chips. The chips render only when the lock
 * data exists on the auction (see useAuctionLiquidityLock) so the row degrades to
 * network + address until the backend serves lock info.
 */
const AuctionHeaderMetadataRow = () => {
  const { t } = useTranslation()
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
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

  const chainInfo = getChainInfo(auctionDetails.chainId)

  const lockedLiquidityTooltip = isPermanentlyLocked
    ? t('toucan.auction.header.lockedLiquidity.tooltip.forever')
    : unlockDateFormatted
      ? t('toucan.auction.header.lockedLiquidity.tooltip', { date: unlockDateFormatted })
      : undefined

  return (
    <Flex row alignItems="center" gap="$spacing8" flexWrap="wrap">
      <Flex row alignItems="center" gap="$spacing6">
        <NetworkLogo chainId={auctionDetails.chainId} size={16} />
        <Text variant="body3" color="$neutral2">
          {chainInfo.label}
        </Text>
      </Flex>
      <Text variant="body3" color="$neutral3">
        ·
      </Text>
      <CopyHelper
        toCopy={auctionDetails.tokenAddress}
        iconPosition="right"
        iconSize={16}
        iconColor="$neutral2"
        color="$neutral2"
        alwaysShowIcon
      >
        <Text variant="body3" color="$neutral2">
          {shortenAddress({ address: auctionDetails.tokenAddress, chars: 4 })}
        </Text>
      </CopyHelper>
      {isLocked && (
        <>
          <Text variant="body3" color="$neutral3">
            ·
          </Text>
          <MetadataChip
            icon={<Lock size="$icon.12" color="$statusSuccess" />}
            label={t('toucan.auction.header.lockedLiquidity')}
            tooltip={lockedLiquidityTooltip}
          />
        </>
      )}
      {isBuybackEnabled && (
        <MetadataChip
          icon={<Fire size="$icon.12" color="$statusCritical" />}
          label={t('toucan.auction.header.buybackEnabled')}
          tooltip={
            hasBurnedTokens && burnedAmountFormatted ? (
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
            ) : (
              t('toucan.auction.header.buyback.tooltip.none')
            )
          }
        />
      )}
    </Flex>
  )
}

const AuctionTokenInfo = ({
  name,
  symbol,
  logoUrl,
  chainId,
  verified,
  tokenDetailsUrl,
  token,
  isCompact,
  isQuickLaunch,
}: {
  name: string
  symbol: string
  logoUrl: string
  chainId: number
  verified: boolean
  tokenDetailsUrl?: string
  token?: CurrencyInfo
  isCompact: boolean
  isQuickLaunch: boolean
}) => {
  const media = useMedia()
  // Token-protection warning icon stays on for every auction, including quick launches: the
  // quick-launch flag is forgeable, so it must not gate a protection signal (exemption policy
  // deferred to security review, LP-1076).
  const severity = token ? getTokenWarningSeverity(token) : WarningSeverity.None
  const { heading: warningHeading, description: warningDescription } = useTokenWarningCardText(token)
  const logoSize = getHeaderLogoSize({ isCompact, media })
  const titleVariant = getHeaderTitleVariant({ isCompact, media })

  const content = (
    <Flex row alignItems="center" gap="$gap16">
      <TokenLogo
        size={logoSize}
        chainId={chainId}
        name={name}
        symbol={symbol}
        url={logoUrl}
        transition={HEADER_TRANSITION}
      />
      <Flex gap={isCompact ? '$gap4' : '$gap8'} justifyContent="center" transition={HEADER_TRANSITION}>
        <Flex row gap="$gap4">
          <Text variant={titleVariant} minWidth={40} transition={HEADER_TRANSITION} {...EllipsisTamaguiStyle}>
            {name}
          </Text>
          {severity > WarningSeverity.Low && (
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
          {/* QuickLaunch: quick-launch badge in the verified-icon slot; curated verified wins when both apply. */}
          {!verified && isQuickLaunch && <Lightning size="$icon.16" color="$statusWarning" />}
          {isQuickLaunch && !isCompact && (
            <Flex ml="$spacing4" justifyContent="center">
              <LiquidityLockedBadge size="small" />
            </Flex>
          )}
        </Flex>
        {!isCompact && (
          <Text variant={titleVariant} textTransform="uppercase" color="$neutral2" transition={HEADER_TRANSITION}>
            {symbol}
          </Text>
        )}
      </Flex>
    </Flex>
  )

  if (tokenDetailsUrl) {
    return (
      <Link to={tokenDetailsUrl} style={{ textDecoration: 'none', width: 'fit-content' }}>
        {content}
      </Link>
    )
  }

  return content
}

export const AuctionHeader = ({ isCompact = false }: { isCompact?: boolean }) => {
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
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

  const isQuickLaunch = useIsQuickLaunchAuction()

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
    <Flex gap="$gap8">
      {!isCompact && <AuctionBreadcrumbs symbol={tokenSymbol} address={auctionDetails.tokenAddress} />}
      <AuctionTokenInfo
        name={tokenName}
        symbol={tokenSymbol}
        logoUrl={logoUrl}
        chainId={auctionDetails.chainId}
        verified={verified}
        tokenDetailsUrl={tokenDetailsUrl}
        token={auctionDetails.token}
        isCompact={isCompact}
        isQuickLaunch={isQuickLaunch}
      />
      {!isCompact && <AuctionHeaderMetadataRow />}
    </Flex>
  )
}
