import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { NumberType } from 'utilities/src/format/types'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { PulsingIndicatorDot } from '~/features/Toucan/Auction/Banners/AuctionIntro/PulsingIndicatorDot'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { approximateNumberFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'

interface TokenLaunchedBannerContentProps {
  tokenName: string
  totalSupply?: string
  auctionTokenDecimals: number
  accentColor: string
  currentTickValue?: number
  isTradeAvailable: boolean
  tradeAvailabilityDurationRemaining: string | undefined
  // Redeemable virtual tokens display the real token's FDV from indexed market data rather than
  // computing it from currentTickValue x totalSupply (which would use the virtual token's supply).
  // `number` → show it; `null` → redeem mode but FDV unavailable, show "--"; `undefined` → compute.
  fdvUsdOverride?: number | null
  // TDP address for the "Trade now" link. Defaults to the auctioned token; set to the real token
  // when the auctioned token is a redeemable virtual token.
  tokenDetailsAddress?: string
}

export function TokenLaunchedBannerContent({
  tokenName,
  totalSupply,
  auctionTokenDecimals,
  accentColor,
  currentTickValue,
  isTradeAvailable,
  tradeAvailabilityDurationRemaining,
  fdvUsdOverride,
  tokenDetailsAddress,
}: TokenLaunchedBannerContentProps) {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const navigate = useNavigate()
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)

  const displayValue = useMemo(() => {
    if (fdvUsdOverride !== undefined) {
      return fdvUsdOverride === null ? '--' : convertFiatAmountFormatted(fdvUsdOverride, NumberType.FiatTokenStats)
    }
    if (currentTickValue === undefined) {
      return '--'
    }
    if (!totalSupply || totalSupply === '0') {
      return convertFiatAmountFormatted(currentTickValue, NumberType.FiatTokenStats)
    }

    const totalTokens = approximateNumberFromRaw({
      raw: BigInt(totalSupply),
      decimals: auctionTokenDecimals,
      significantDigits: 15,
    })

    const currentFdvUsd = currentTickValue * totalTokens
    if (!Number.isFinite(currentFdvUsd)) {
      return '--'
    }

    return convertFiatAmountFormatted(currentFdvUsd, NumberType.FiatTokenStats)
  }, [auctionTokenDecimals, convertFiatAmountFormatted, currentTickValue, fdvUsdOverride, totalSupply])

  const onPress = useCallback(() => {
    if (!auctionDetails) {
      return
    }
    const tokenDetailsURL = getTokenDetailsURL({
      address: tokenDetailsAddress ?? auctionDetails.tokenAddress,
      chain: toGraphQLChain(auctionDetails.chainId),
    })
    navigate(tokenDetailsURL)
  }, [auctionDetails, navigate, tokenDetailsAddress])

  const canPress = Boolean(auctionDetails && isTradeAvailable)
  const isCountingDown = !isTradeAvailable && Boolean(tradeAvailabilityDurationRemaining)
  // Only show the second line when it carries something actionable or temporal: the "Trade now" CTA
  // once trading is live, or the countdown while it isn't. Without a countdown the status line stands
  // alone ("Available to trade soon") so we don't stack a dangling label over a bare "Soon".
  const showActionRow = isTradeAvailable || isCountingDown

  let statusLabel: string
  if (isTradeAvailable) {
    statusLabel = t('toucan.auction.tokenLaunchedBanner.availableToTrade', { tokenName })
  } else if (isCountingDown) {
    statusLabel = t('toucan.auction.tokenLaunchedBanner.availableToTradeIn')
  } else {
    statusLabel = t('toucan.auction.tokenLaunchedBanner.availableToTradeSoon')
  }

  return (
    <Flex width="100%" row justifyContent="space-between" alignItems="center" position="relative" zIndex={1}>
      {/* Left side - Status + Trade now */}
      <Flex row alignItems="center" gap="$spacing12">
        <PulsingIndicatorDot color={accentColor} />
        <Flex>
          <Text variant="body4" color="$neutral2">
            {statusLabel}
          </Text>
          {showActionRow && (
            <Trace logPress element={ElementName.AuctionTokenTradeNowButton}>
              <TouchableArea onPress={canPress ? onPress : undefined} cursor={canPress ? 'pointer' : 'default'}>
                <Flex row alignItems="center" gap="$spacing4">
                  <Text variant="buttonLabel2" color="$neutral1">
                    {isTradeAvailable
                      ? t('toucan.auction.tokenLaunchedBanner.tradeNow')
                      : t('toucan.auction.tokenLaunchedBanner.tradeAvailableIn', {
                          time: tradeAvailabilityDurationRemaining ?? t('common.unknown'),
                        })}
                  </Text>
                  {isTradeAvailable && <ArrowRight size="$icon.16" color="$neutral1" />}
                </Flex>
              </TouchableArea>
            </Trace>
          )}
        </Flex>
      </Flex>

      {/* Right side - FDV stats */}
      <Flex alignItems="flex-end" flexShrink={0} pl="$spacing12" $md={{ display: 'none' }}>
        <Text variant="body4" color="$neutral2">
          {t('toucan.auction.currentFdv')}
        </Text>
        <Text variant="heading3" color="$neutral1">
          {displayValue}
        </Text>
      </Flex>
    </Flex>
  )
}
