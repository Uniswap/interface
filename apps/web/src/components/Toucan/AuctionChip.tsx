import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { iconSizes, opacifyRaw } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { getAuctionMetadata } from '~/components/Toucan/Config/config'
import type { CommittedVolumeTableValue } from '~/components/Toucan/utils/computeCommittedVolume'
import type { ProjectedFdvTableValue } from '~/components/Toucan/utils/computeProjectedFdv'
import { createDottedBackgroundStyles } from '~/components/Toucan/utils/createDottedBackgroundStyles'
import { useSrcColor } from '~/hooks/useColor'
import type { AuctionWithCurrencyInfo } from '~/state/explore/topAuctions/useTopAuctions'
import { getChainUrlParam } from '~/utils/chainParams'

const DOT_OPACITY = 10
const TOKEN_BACKGROUND_OPACITY = 8

interface AuctionChipProps {
  auction: AuctionWithCurrencyInfo
  projectedFdv: ProjectedFdvTableValue
  committedVolume: CommittedVolumeTableValue
}

export function AuctionChip({ auction, projectedFdv, committedVolume }: AuctionChipProps) {
  const navigate = useNavigate()
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const chainId = auction.auction?.chainId
  const address = auction.auction?.address
  const tokenAddress = auction.auction?.tokenAddress
  const auctionTokenSymbol = auction.auction?.tokenSymbol
  const logoOverride = chainId && tokenAddress ? getAuctionMetadata({ chainId, tokenAddress })?.logoUrl : undefined

  const tokenName = auction.currencyInfo?.currency.name || auctionTokenSymbol || tokenAddress
  const tokenSymbol = auction.currencyInfo?.currency.symbol || auctionTokenSymbol
  const logoUrl = logoOverride ?? auction.currencyInfo?.logoUrl

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
            {t('toucan.auction.projectedFdv')}
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
            {committedVolume.usd !== undefined
              ? convertFiatAmountFormatted(committedVolume.usd, NumberType.FiatTokenStats)
              : committedVolume.formattedBidToken}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
