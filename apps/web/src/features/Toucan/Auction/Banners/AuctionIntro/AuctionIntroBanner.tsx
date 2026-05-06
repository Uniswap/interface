import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { PulsingIndicatorDot } from '~/features/Toucan/Auction/Banners/AuctionIntro/PulsingIndicatorDot'
import { useAuctionIntroBannerData } from '~/features/Toucan/Auction/Banners/AuctionIntro/useAuctionIntroBannerData'

interface AuctionIntroBannerProps {
  onLearnMorePress: () => void
}

export function AuctionIntroBanner({ onLearnMorePress }: AuctionIntroBannerProps) {
  const { t } = useTranslation()

  const {
    shouldShowBanner,
    variant,
    durationRemaining,
    durationLabel,
    tokenAccentColor,
    backgroundGradientStyle,
    isColorLoading,
  } = useAuctionIntroBannerData()

  if (!shouldShowBanner || isColorLoading) {
    return null
  }

  const isNotStarted = variant === 'not-started'

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      px="$spacing24"
      py="$spacing16"
      borderRadius="$rounded12"
      overflow="hidden"
      style={backgroundGradientStyle}
    >
      {/* Left side - Timer */}
      <Flex row alignItems="center" gap="$spacing12">
        <PulsingIndicatorDot color={tokenAccentColor} isPulsing={!isNotStarted} />
        <Flex>
          <Text variant="body4" color="$neutral2">
            {durationLabel}
          </Text>
          <Text variant="body1" color="$neutral1">
            {durationRemaining ?? ''}
          </Text>
        </Flex>
      </Flex>

      {/* Right side - See full details button */}
      <TouchableArea onPress={onLearnMorePress} hoverStyle={{ opacity: 0.8 }}>
        <Flex row alignItems="center" gap="$spacing8">
          <Text variant="buttonLabel2" color="$neutral1">
            {t('toucan.auction.introBanner.seeFullDetails')}
          </Text>
          <ChevronsOut size={18} color="$neutral1" />
        </Flex>
      </TouchableArea>
    </Flex>
  )
}
