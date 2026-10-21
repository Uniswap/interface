import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { ChevronsOut } from '@universe/mycelium/icons/ChevronsOut'
import { opacifyRaw } from '@universe/mycelium/theme-hooks-compat'
import { useTranslation } from 'react-i18next'
import { PulsingIndicatorDot } from '~/features/Toucan/Auction/Banners/AuctionIntro/PulsingIndicatorDot'
import { useAuctionIntroBannerData } from '~/features/Toucan/Auction/Banners/AuctionIntro/useAuctionIntroBannerData'

interface AuctionIntroBannerProps {
  onLearnMorePress: () => void
}

export function AuctionIntroBanner({ onLearnMorePress }: AuctionIntroBannerProps) {
  const { t } = useTranslation()
  const isTokenProvenanceEnabled = useFeatureFlag(FeatureFlags.TokenProvenance)

  const {
    shouldShowBanner,
    variant,
    durationRemaining,
    durationLabel,
    oneLineCountdown,
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
      flexWrap={isTokenProvenanceEnabled ? 'wrap' : undefined}
      gap={isTokenProvenanceEnabled ? '$spacing8' : undefined}
      px="$spacing24"
      py="$spacing16"
      borderRadius={isTokenProvenanceEnabled ? '$rounded16' : '$rounded12'}
      borderWidth={isTokenProvenanceEnabled ? '$spacing1' : undefined}
      mt={isTokenProvenanceEnabled ? '$spacing24' : undefined}
      overflow="hidden"
      style={{
        ...backgroundGradientStyle,
        borderColor: isTokenProvenanceEnabled ? opacifyRaw(8, tokenAccentColor) : undefined,
        backgroundClip: isTokenProvenanceEnabled ? 'padding-box' : undefined,
      }}
    >
      <Flex row alignItems="center" gap="$spacing12">
        <PulsingIndicatorDot color={tokenAccentColor} isPulsing={!isNotStarted} />
        {isTokenProvenanceEnabled && oneLineCountdown !== undefined ? (
          <Text variant="body1" color="$neutral1">
            {oneLineCountdown}
          </Text>
        ) : (
          <Flex>
            <Text variant="body4" color="$neutral2">
              {durationLabel}
            </Text>
            <Text variant="body1" color="$neutral1">
              {durationRemaining ?? ''}
            </Text>
          </Flex>
        )}
      </Flex>

      <TouchableArea
        onPress={onLearnMorePress}
        ml={isTokenProvenanceEnabled ? 'auto' : undefined}
        hoverStyle={{ opacity: 0.8 }}
      >
        <Flex row alignItems="center" gap="$spacing8">
          <Text variant="buttonLabel2" color="$neutral1">
            {isTokenProvenanceEnabled
              ? t('toucan.auction.introBanner.timelineAndDetails')
              : t('toucan.auction.introBanner.seeFullDetails')}
          </Text>
          <ChevronsOut size={18} color="$neutral1" />
        </Flex>
      </TouchableArea>
    </Flex>
  )
}
