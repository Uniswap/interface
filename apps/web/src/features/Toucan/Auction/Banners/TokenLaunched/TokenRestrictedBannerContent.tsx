import { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { PulsingIndicatorDot } from '~/features/Toucan/Auction/Banners/AuctionIntro/PulsingIndicatorDot'
import { TokenLaunchedBannerWrapper } from '~/features/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBannerWrapper'

interface TokenRestrictedBannerContentProps {
  bannerGradient: CSSProperties
  accentColor: string
}

export function TokenRestrictedBannerContent({ bannerGradient, accentColor }: TokenRestrictedBannerContentProps) {
  const { t } = useTranslation()

  return (
    <TokenLaunchedBannerWrapper bannerGradient={bannerGradient}>
      <Flex row alignItems="center" gap="$spacing12" position="relative" zIndex={zIndexes.default}>
        <PulsingIndicatorDot color={accentColor} />
        <Flex gap="$spacing2" flexShrink={1}>
          <Text variant="body3" $sm={{ variant: 'body4' }} color="$neutral1">
            {t('toucan.auction.tokenLaunchedBanner.restrictedHeading')}
          </Text>
          <Text variant="body4" color="$neutral2">
            {t('toucan.auction.tokenLaunchedBanner.restrictedSubheading')}
          </Text>
        </Flex>
      </Flex>
    </TokenLaunchedBannerWrapper>
  )
}
