import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, useMedia } from 'ui/src'
import { PulsingIndicatorDot } from '~/components/Toucan/Auction/Banners/AuctionIntro/PulsingIndicatorDot'
import { useAuctionIntroBannerData } from '~/components/Toucan/Auction/Banners/AuctionIntro/useAuctionIntroBannerData'
import { ToucanContainer } from '~/components/Toucan/Shared/ToucanContainer'

interface AuctionIntroBannerProps {
  onLearnMorePress: () => void
}

export function AuctionIntroBanner({ onLearnMorePress }: AuctionIntroBannerProps) {
  const { t } = useTranslation()
  const media = useMedia()

  const {
    shouldShowBanner,
    variant,
    durationRemaining,
    durationLabel,
    tokenAccentColor,
    dottedBackgroundStyle,
    radialGradientStyle,
    backgroundColor,
    isColorLoading,
  } = useAuctionIntroBannerData()

  if (!shouldShowBanner || isColorLoading) {
    return null
  }

  const isNotStarted = variant === 'not-started'

  return (
    <Flex
      width="100vw"
      mb="$spacing24"
      height={60}
      overflow="hidden"
      backgroundColor={backgroundColor}
      style={{
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
      }}
    >
      {/* Dotted background pattern layer */}
      <Flex
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        pointerEvents="none"
        style={dottedBackgroundStyle}
      />

      {/* Radial gradient overlay - adds depth and softens dots */}
      {radialGradientStyle && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          pointerEvents="none"
          style={radialGradientStyle}
        />
      )}
      <ToucanContainer mt="$spacing12" zIndex={1} $md={{ px: 42 }} $sm={{ px: 26 }}>
        <Flex row alignItems="center" justifyContent="space-between" width="100%">
          {/* Left side - Timer */}
          <Flex row alignItems="center" gap="$spacing12">
            <Text variant="body1" color="$neutral2" $lg={{ variant: 'body3' }} $sm={{ display: 'none' }}>
              {durationLabel}
            </Text>
            <Flex row alignItems="center" gap="$spacing8">
              <PulsingIndicatorDot color={tokenAccentColor} isPulsing={!isNotStarted} />
              <Text variant="body1" $lg={{ variant: 'body3' }} color="$neutral1">
                {durationRemaining ?? ''}
              </Text>
            </Flex>
          </Flex>

          {/* Right side - Learn more button */}
          <TouchableArea
            onPress={onLearnMorePress}
            px="$spacing12"
            py="$spacing8"
            borderRadius="$rounded12"
            hoverStyle={{ opacity: 0.8 }}
          >
            <Text variant="buttonLabel2" $lg={{ variant: 'buttonLabel3' }} color="$neutral1">
              {media.md ? t('common.button.learn') : t('toucan.auction.introBanner.learnAboutAuctions')}
            </Text>
          </TouchableArea>
        </Flex>
      </ToucanContainer>
    </Flex>
  )
}
