import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { iconSizes, opacifyRaw } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { useAuctionTimeRemaining } from '~/components/Toucan/Auction/hooks/useAuctionTimeRemaining'
import { formatCompactFromRaw } from '~/components/Toucan/Auction/utils/fixedPointFdv'
import { getAuctionMetadata } from '~/components/Toucan/Config/config'
import { computeProjectedFdvTableValue } from '~/components/Toucan/utils/computeProjectedFdv'
import { createDottedBackgroundStyles } from '~/components/Toucan/utils/createDottedBackgroundStyles'
import { useSrcColor } from '~/hooks/useColor'
import type { EnrichedAuction } from '~/state/explore/topAuctions/useTopAuctions'
import { getChainUrlParam } from '~/utils/chainParams'

const DOT_OPACITY = 10
const TOKEN_BACKGROUND_OPACITY = 8

export function AuctionChip({
  auction,
  auctionTokenUsdPrice,
}: {
  auction: EnrichedAuction
  auctionTokenUsdPrice?: number
}) {
  const navigate = useNavigate()
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const chainId = auction.auction?.chainId
  const tokenAddress = auction.auction?.tokenAddress
  const tokenName = auction.auction?.tokenName
  const tokenSymbol = auction.auction?.tokenSymbol

  const projectedFdv = computeProjectedFdvTableValue({ auction, auctionTokenUsdPrice })

  const address = auction.auction?.address
  const logoOverride = chainId && tokenAddress ? getAuctionMetadata({ chainId, tokenAddress })?.logoUrl : undefined
  const logoUrl = logoOverride ?? auction.logoUrl

  // Color extraction logic
  const { tokenColor, tokenColorLoading } = useSrcColor({
    src: logoUrl ?? undefined,
    currencyName: tokenName,
    backgroundColor: colors.surface3.val,
  })

  // Lock the first valid token color to prevent style recalculation flicker
  const lockedTokenColorRef = useRef<string | null>(null)

  // Reset locked color when logoUrl changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: logoUrl is intentionally a dependency to trigger reset on logo change
  useEffect(() => {
    lockedTokenColorRef.current = null
  }, [logoUrl])

  // Lock the token color once loading completes
  useEffect(() => {
    if (!tokenColorLoading && tokenColor) {
      lockedTokenColorRef.current = tokenColor
    }
  }, [tokenColorLoading, tokenColor])

  // Use locked color for styles (fallback to neutral3 while loading)
  const effectiveTokenColor = lockedTokenColorRef.current ?? tokenColor ?? colors.neutral3.val

  // Calculate time remaining and progress
  const { durationString, progressPercentage } = useAuctionTimeRemaining({
    startBlockTimestamp: auction.timeRemaining.startBlockTimestamp,
    endBlockTimestamp: auction.timeRemaining.endBlockTimestamp,
  })

  // Create dotted background pattern using token color
  const { dottedBackgroundStyle } = useMemo(
    () =>
      createDottedBackgroundStyles({
        dotColor: effectiveTokenColor,
        dotOpacity: DOT_OPACITY,
      }),
    [effectiveTokenColor],
  )

  const handleClick = () => {
    if (!chainId) {
      return
    }
    const chainUrlParam = getChainUrlParam(chainId)
    if (chainUrlParam) {
      navigate(`/explore/auctions/${chainUrlParam}/${address}`)
    }
  }

  if (!auction.auction) {
    return null
  }

  return (
    <TouchableArea
      borderWidth={1}
      borderColor="$surface3"
      backgroundColor={opacifyRaw(TOKEN_BACKGROUND_OPACITY, effectiveTokenColor)}
      borderRadius="$rounded16"
      padding="$spacing16"
      flexDirection="column"
      gap="$spacing12"
      flexShrink={0}
      onPress={handleClick}
      hoverStyle={{
        backgroundColor: opacifyRaw(TOKEN_BACKGROUND_OPACITY + 4, effectiveTokenColor),
        borderColor: '$surface3Hovered',
      }}
      style={{
        boxShadow: '0px 1px 6px 2px rgba(0,0,0,0.03), 0px 1px 2px 0px rgba(0,0,0,0.02)',
      }}
    >
      {/* Grey dotted pattern layer on top of token background */}
      <Flex
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        pointerEvents="none"
        borderRadius="$rounded16"
        overflow="hidden"
        style={dottedBackgroundStyle}
      />

      <Flex flexDirection="row" gap="$spacing8" alignItems="center">
        <TokenLogo url={logoUrl} size={iconSizes.icon32} chainId={chainId} symbol={tokenSymbol} name={tokenName} />
        <Flex flex={1} minWidth={0}>
          <Flex row alignItems="center" gap="$gap4">
            <Text variant="body2" color="$neutral1" numberOfLines={1}>
              {tokenName}
            </Text>
            {auction.verified && <CheckmarkCircle size="$icon.16" color="$accent1" />}
          </Flex>
          <Text variant="body3" color="$neutral2" numberOfLines={1}>
            {tokenSymbol}
          </Text>
        </Flex>
      </Flex>

      <Flex flexDirection="row" gap="$spacing12" alignItems="stretch">
        <Flex flexDirection="column" gap="$gap4" flex={1}>
          <Text variant="body4" color="$neutral2">
            {t('stats.fdv')}
          </Text>
          <Text variant="body3" color="$neutral1" numberOfLines={1}>
            {projectedFdv.usd !== undefined
              ? convertFiatAmountFormatted(projectedFdv.usd, NumberType.FiatTokenStats)
              : projectedFdv.formattedBidToken}
          </Text>
        </Flex>

        <Flex width={1} backgroundColor="$surface3" />

        <Flex flexDirection="column" gap="$gap4" flex={1}>
          <Text variant="body4" color="$neutral2">
            {t('toucan.auction.committedVolume')}
          </Text>
          <Text variant="body3" color="$neutral1" numberOfLines={1}>
            {auction.auction.totalBidVolumeUsd !== undefined
              ? convertFiatAmountFormatted(auction.auction.totalBidVolumeUsd, NumberType.FiatTokenStats)
              : auction.auction.totalBidVolume && auction.auction.currencyTokenDecimals
                ? formatCompactFromRaw({
                    raw: BigInt(auction.auction.totalBidVolume),
                    decimals: auction.auction.currencyTokenDecimals,
                  })
                : undefined}
          </Text>
        </Flex>
      </Flex>

      {/* Time remaining progress bar with overlaid text */}
      {durationString && (
        <Flex position="relative" width="100%" height="8px">
          {/* Background track and progress fill */}
          <Flex width="100%" height="100%" backgroundColor="$surface3" borderRadius="$roundedFull" overflow="hidden">
            {/* Filled progress using token color */}
            <Flex
              width={`${Math.min(100, Math.max(0, progressPercentage))}%`}
              height="100%"
              backgroundColor={effectiveTokenColor}
            />
          </Flex>

          {/* Overlaid duration text (at progress point, with edge protection) */}
          <Flex
            position="absolute"
            top="50%"
            left={`${Math.min(100, Math.max(0, progressPercentage))}%`}
            backgroundColor="$scrim"
            borderRadius="$rounded4"
            padding="$spacing4"
            style={{
              transform: `translate(-${progressPercentage}%, -50%)`,
              backdropFilter: 'blur(2px)',
            }}
          >
            <Text variant="body4" color="$white" whiteSpace="nowrap">
              {durationString}
            </Text>
          </Flex>
        </Flex>
      )}
    </TouchableArea>
  )
}
