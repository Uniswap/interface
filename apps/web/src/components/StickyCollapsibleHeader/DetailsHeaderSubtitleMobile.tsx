import { Flex, Text, UniversalImage } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useTranslation } from 'react-i18next'
import { iconSizes } from 'ui/src/theme'
import { getRWAIssuerLabel } from 'uniswap/src/features/rwa/issuers'
import type { RWAIssuerDisplay } from 'uniswap/src/features/rwa/types'
import { useRWAIssuerLogoUrl } from 'uniswap/src/features/rwa/useRWAIssuerLogoUrl'

interface DetailsHeaderSubtitleMobileProps {
  issuer?: RWAIssuerDisplay
  symbol: string
  isCompact: boolean
}

// On mobile web the desktop metadata row is hidden or replaced, so a second line is rendered beneath
// the name: the RWA issuer for matched assets, otherwise the ticker symbol. Both shrink when the
// sticky header is compact (scrolled). Shared by the token details and auction headers.
export function DetailsHeaderSubtitleMobile({
  issuer,
  symbol,
  isCompact,
}: DetailsHeaderSubtitleMobileProps): JSX.Element | null {
  const { t } = useTranslation()
  const media = useMedia()
  const configLogoUrl = useRWAIssuerLogoUrl(issuer?.issuer)
  const issuerLabel = issuer && getRWAIssuerLabel(issuer)

  if (!media.sm) {
    return null
  }

  const textVariant = isCompact ? 'body4' : 'body3'

  if (!issuer || !issuerLabel) {
    return (
      <Text variant={textVariant} color="$neutral2" textTransform="uppercase" whiteSpace="nowrap" mt="$spacing1">
        {symbol}
      </Text>
    )
  }

  const issuerLogoUrl = issuer.issuerLogoUrl ?? configLogoUrl
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
        {isCompact ? issuerLabel : t('tdp.rwa.issuedBy', { issuer: issuerLabel })}
      </Text>
    </Flex>
  )
}
