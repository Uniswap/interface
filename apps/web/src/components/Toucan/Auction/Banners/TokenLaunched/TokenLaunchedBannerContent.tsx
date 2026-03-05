import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, Text, TouchableArea, useMedia } from 'ui/src'
import { Rocket } from 'ui/src/components/icons/Rocket'
import { opacifyRaw } from 'ui/src/theme/color/utils'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { NumberType } from 'utilities/src/format/types'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { ArrowChangeDown } from '~/components/Icons/ArrowChangeDown'
import { ArrowChangeUp } from '~/components/Icons/ArrowChangeUp'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { approximateNumberFromRaw } from '~/components/Toucan/Auction/utils/fixedPointFdv'

interface TokenLaunchedBannerContentProps {
  tokenName: string
  totalSupply?: string
  auctionTokenDecimals: number
  accentColor: string
  currentTickValue?: number
  changePercentage?: number
}

const ICON_BOX_SIZE = 48
const ICON_BOX_MWEB_SIZE = 32

export function TokenLaunchedBannerContent({
  tokenName,
  totalSupply,
  auctionTokenDecimals,
  accentColor,
  currentTickValue,
  changePercentage,
}: TokenLaunchedBannerContentProps) {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()
  const navigate = useNavigate()
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  const media = useMedia()

  // Calculate FDV display value
  // currentTickValue is already in USD (from GraphQL market price or fallback clearing price conversion)
  // Just multiply by total supply to get FDV
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
    const fdvUSD = currentTickValue * totalTokens
    return convertFiatAmountFormatted(fdvUSD, NumberType.FiatTokenStats)
  }, [currentTickValue, totalSupply, auctionTokenDecimals, convertFiatAmountFormatted])

  const isPositiveChange = (changePercentage ?? 0) >= 0
  const deltaColorToken = isPositiveChange ? '$statusSuccess' : '$statusCritical'

  const deltaPercent = changePercentage !== undefined ? formatPercent(Math.abs(changePercentage) / 100) : '--'

  const iconBoxBackground = opacifyRaw(12, accentColor)

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
      <Flex row alignItems="center" gap="$spacing12" flexShrink={1} minWidth={0}>
        <Flex
          width={ICON_BOX_SIZE}
          height={ICON_BOX_SIZE}
          $sm={{ width: ICON_BOX_MWEB_SIZE, height: ICON_BOX_MWEB_SIZE }}
          borderRadius="$rounded12"
          backgroundColor={iconBoxBackground}
          justifyContent="center"
          alignItems="center"
          mr="$spacing4"
        >
          <Rocket size={media.sm ? '$icon.20' : '$icon.24'} color={accentColor} />
        </Flex>
        <Flex gap="$spacing4" alignItems="flex-start" flexShrink={1} minWidth={0}>
          <Text
            variant="subheading1"
            $sm={{ variant: 'subheading2' }}
            color="$neutral1"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('toucan.auction.tokenLaunchedBanner.launchedHeading', {
              tokenName,
            })}
          </Text>
          <Text variant="body2" $md={{ variant: 'body3' }} $sm={{ variant: 'body4' }} color="$neutral2">
            {t('toucan.auction.tokenLaunchedBanner.launchedSubheading')}
          </Text>
          <Trace logPress element={ElementName.AuctionTokenTradeNowButton}>
            <TouchableArea onPress={onPress} disabled={isDisabled}>
              <Text
                variant="buttonLabel2"
                $md={{ variant: 'buttonLabel3' }}
                $sm={{ variant: 'buttonLabel4' }}
                color={accentColor}
              >
                {t('toucan.auction.tokenLaunchedBanner.tradeNow')}
              </Text>
            </TouchableArea>
          </Trace>
        </Flex>
      </Flex>
      <Flex gap="$spacing2" $md={{ display: 'none', width: 'auto' }} flexShrink={0} pl="$spacing12">
        <Flex row alignItems="center" gap="$spacing4">
          <Text variant="body3" $md={{ variant: 'body4' }} color="$neutral2">
            {t('toucan.auction.currentFdv')}
          </Text>
        </Flex>
        <Text variant="heading2" $lg={{ variant: 'heading3' }} color="$neutral1">
          {displayValue}
        </Text>
        {changePercentage !== undefined && (
          <Flex row gap="$spacing4" alignItems="center">
            <Flex width="$spacing16" height="$spacing16" alignItems="center" justifyContent="center">
              <Text color={deltaColorToken}>
                {isPositiveChange ? (
                  <ArrowChangeUp color={deltaColorToken} width="$spacing16" height="$spacing16" />
                ) : (
                  <ArrowChangeDown color={deltaColorToken} width="$spacing16" height="$spacing16" />
                )}
              </Text>
            </Flex>
            <Text variant="body4" color={deltaColorToken}>
              {deltaPercent}
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
