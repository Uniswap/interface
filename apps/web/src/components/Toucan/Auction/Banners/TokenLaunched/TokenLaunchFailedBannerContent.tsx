import { CSSProperties, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { opacifyRaw, zIndexes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TokenLaunchedBannerWrapper } from '~/components/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBannerWrapper'
import { ExternalLink } from '~/theme/components/Links'

const LEARN_MORE_URL = uniswapUrls.helpArticleUrls.toucanFailedToLaunchHelp

interface TokenLaunchFailedBannerContentProps {
  tokenName: string
  bannerGradient: CSSProperties
}

export function TokenLaunchFailedBannerContent({ tokenName, bannerGradient }: TokenLaunchFailedBannerContentProps) {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const accentColor = colors.statusCritical.val
  const iconBackgroundColor = useMemo(() => opacifyRaw(12, accentColor), [accentColor])

  return (
    <TokenLaunchedBannerWrapper bannerGradient={bannerGradient}>
      <Flex row justifyContent="space-between" alignItems="center" position="relative" zIndex={zIndexes.default}>
        <Flex
          row
          alignItems="center"
          gap="$spacing20"
          $md={{ gap: '$spacing12' }}
          flexShrink={1}
          width={450}
          maxWidth="100%"
        >
          <Flex
            width={48}
            height={48}
            $sm={{ width: 40, height: 40 }}
            borderRadius="$rounded12"
            alignItems="center"
            justifyContent="center"
            backgroundColor={iconBackgroundColor}
          >
            <AlertTriangleFilled
              color="$statusCritical"
              fill={accentColor}
              size="$icon.24"
              $sm={{ size: '$icon.20' }}
            />
          </Flex>
          <Flex gap="$spacing2" flexShrink={1}>
            <Text variant="subheading1" $md={{ variant: 'subheading2' }} $sm={{ variant: 'body3' }} color="$neutral1">
              {t('toucan.auction.tokenLaunchedBanner.failedHeading', {
                tokenName,
              })}
            </Text>
            <Text variant="body2" $md={{ variant: 'body3' }} $sm={{ variant: 'body4' }} color="$neutral2">
              {t('toucan.auction.tokenLaunchedBanner.failedSubheading')}
            </Text>
          </Flex>
        </Flex>
        <Flex row alignItems="center" gap="$spacing4" pl="$spacing12" flexShrink={0} $md={{ display: 'none' }}>
          <ExternalLink href={LEARN_MORE_URL} style={{ textDecoration: 'none' }}>
            <Text variant="buttonLabel2" color="$neutral2" $md={{ variant: 'buttonLabel3' }}>
              {t('common.button.learn')}
            </Text>
          </ExternalLink>
        </Flex>
      </Flex>
    </TokenLaunchedBannerWrapper>
  )
}
