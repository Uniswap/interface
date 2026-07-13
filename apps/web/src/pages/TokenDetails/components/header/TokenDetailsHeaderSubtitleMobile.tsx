import { useTranslation } from 'react-i18next'
import { Flex, Text, UniversalImage, useMedia } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { getRWAIssuerDisplayName } from 'uniswap/src/features/rwa/issuers'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useRWAIssuerLogoUrl } from 'uniswap/src/features/rwa/useRWAIssuerLogoUrl'

interface TokenDetailsHeaderSubtitleMobileProps {
  rwaMatch?: RWAMatch
  symbol: string
  isCompact: boolean
}

// On mobile web the desktop header row (issuer + network filter + address) is hidden, so a second
// line is rendered beneath the token name: the RWA issuer for matched assets, otherwise the ticker
// symbol. Both shrink when the sticky header is compact (scrolled).
export function TokenDetailsHeaderSubtitleMobile({
  rwaMatch,
  symbol,
  isCompact,
}: TokenDetailsHeaderSubtitleMobileProps): JSX.Element | null {
  const { t } = useTranslation()
  const media = useMedia()
  const issuerLogoUrl = useRWAIssuerLogoUrl(rwaMatch?.token.issuer)

  if (!media.sm) {
    return null
  }

  const textVariant = isCompact ? 'body4' : 'body3'

  if (!rwaMatch) {
    return (
      <Text variant={textVariant} color="$neutral2" textTransform="uppercase" whiteSpace="nowrap" mt="$spacing1">
        {symbol}
      </Text>
    )
  }

  const displayName = getRWAIssuerDisplayName(rwaMatch.token.issuer)
  const logoSize = iconSizes.icon16

  return (
    <Flex row alignItems="center" gap="$gap4" mt="$spacing1">
      {issuerLogoUrl ? (
        <UniversalImage
          allowLocalUri
          size={{ height: logoSize, width: logoSize }}
          style={{ image: { borderRadius: logoSize } }}
          uri={issuerLogoUrl}
        />
      ) : null}
      <Text variant={textVariant} color={isCompact ? '$neutral2' : '$neutral1'} whiteSpace="nowrap">
        {isCompact ? displayName : t('tdp.rwa.issuedBy', { issuer: displayName })}
      </Text>
    </Flex>
  )
}
