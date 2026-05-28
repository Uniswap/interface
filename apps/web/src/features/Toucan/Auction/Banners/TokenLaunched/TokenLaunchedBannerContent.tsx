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
}

export function TokenLaunchedBannerContent({
  tokenName,
  totalSupply,
  auctionTokenDecimals,
  accentColor,
  currentTickValue,
}: TokenLaunchedBannerContentProps) {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const navigate = useNavigate()
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)

  const displayValue = useMemo(() => {
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
  }, [auctionTokenDecimals, convertFiatAmountFormatted, currentTickValue, totalSupply])

  const onPress = useCallback(() => {
    if (!auctionDetails) {
      return
    }
    const tokenDetailsURL = getTokenDetailsURL({
      address: auctionDetails.tokenAddress,
      chain: toGraphQLChain(auctionDetails.chainId),
    })
    navigate(tokenDetailsURL)
  }, [auctionDetails, navigate])

  const isDisabled = !auctionDetails

  return (
    <Flex width="100%" row justifyContent="space-between" alignItems="center" position="relative" zIndex={1}>
      {/* Left side - Status + Trade now */}
      <Flex row alignItems="center" gap="$spacing12">
        <PulsingIndicatorDot color={accentColor} />
        <Flex>
          <Text variant="body4" color="$neutral2">
            {t('toucan.auction.tokenLaunchedBanner.availableToTrade', { tokenName })}
          </Text>
          <Trace logPress element={ElementName.AuctionTokenTradeNowButton}>
            <TouchableArea onPress={onPress} disabled={isDisabled}>
              <Flex row alignItems="center" gap="$spacing4">
                <Text variant="buttonLabel2" color="$neutral1">
                  {t('toucan.auction.tokenLaunchedBanner.tradeNow')}
                </Text>
                <ArrowRight size="$icon.16" color="$neutral1" />
              </Flex>
            </TouchableArea>
          </Trace>
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
