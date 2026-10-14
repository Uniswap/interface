import { isWebPlatform } from '@universe/environment'
import { Flex, Text, iconSizes, useIsTouchDevice } from '@universe/mycelium'
import { TooltipCompat as Tooltip } from '@universe/mycelium/tooltip-compat'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { getIssuerTokenLabel } from 'uniswap/src/data/apiClients/dataApiService/rwa/formatIssuerDisplaySymbol'
import { GrayscaleIssuerLogo } from 'uniswap/src/features/rwa/GrayscaleIssuerLogo'
import { type RWAIssuerDisplay, UNKNOWN_RWA_ISSUER } from 'uniswap/src/features/rwa/types'
import { useRWAIssuerLogoUrl } from 'uniswap/src/features/rwa/useRWAIssuerLogoUrl'
import { useEvent } from 'utilities/src/react/hooks'

// 12px beside body2 titles (web), 16px beside body1 titles (mobile rows); body2 rows on mobile pass `size`.
const DEFAULT_LOGO_SIZE = isWebPlatform ? iconSizes.icon12 : iconSizes.icon16

/**
 * Issuer treatment appended to a token name: a grayscale issuer logo with the issuer name in a hover tooltip (web
 * only), or the dimmed issuer label when `showLogo` is off or no logo is available.
 */
export const RWAIssuerTag = memo(function RWAIssuerTag({
  issuer,
  size = DEFAULT_LOGO_SIZE,
  showLogo = true,
}: {
  issuer: RWAIssuerDisplay
  size?: number
  showLogo?: boolean
}): JSX.Element | null {
  const { t } = useTranslation()
  const isTouchDevice = useIsTouchDevice()
  const configLogoUrl = useRWAIssuerLogoUrl(issuer.issuer)
  const label = getIssuerTokenLabel(issuer)
  // On touch the tooltip opens on tap, so the tap must not also fire the enclosing row link/press.
  const onTriggerPress = useEvent((event: { preventDefault: () => void; stopPropagation: () => void }): void => {
    if (!isTouchDevice) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
  })
  // v1 ListRwaTokens serves issuer-less commodities as an empty slug; render nothing rather than a blank badge.
  if (!label || issuer.issuer === UNKNOWN_RWA_ISSUER) {
    return null
  }
  // Backend branding wins: commodity issuer ids are CoinGecko slugs with no Statsig logo entry.
  const logoUrl = showLogo ? issuer.issuerLogoUrl || configLogoUrl : undefined
  if (!logoUrl) {
    return (
      <Text color="$neutral3" variant="body3" numberOfLines={1} flexShrink={0}>
        {label}
      </Text>
    )
  }
  const issuedBy = t('tdp.rwa.issuedBy', { issuer: label })

  return (
    <Tooltip placement="top">
      <Tooltip.Trigger cursor="default" onPress={onTriggerPress}>
        {/* Title rows baseline-align their text; on native a non-text view has no baseline and lands a line below the
            title, so the logo centers itself instead. The label lives here too: the native Trigger is a fragment, so
            its own props never reach a view. */}
        <Flex alignSelf="center" flexShrink={0} aria-label={issuedBy} accessibilityLabel={issuedBy}>
          <GrayscaleIssuerLogo uri={logoUrl} size={size} />
        </Flex>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Text variant="body4" color="$neutral1">
          {issuedBy}
        </Text>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
})
