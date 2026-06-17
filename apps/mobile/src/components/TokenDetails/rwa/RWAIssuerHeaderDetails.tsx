import { Flex, Text, UniversalImage } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { getRWAIssuerDisplayName } from 'uniswap/src/features/rwa/issuers'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useRWAIssuerLogoUrl } from 'uniswap/src/features/rwa/useRWAIssuerLogoUrl'

type RWAIssuerHeaderDetailsProps = {
  rwaMatch?: RWAMatch
}

export function RWAIssuerHeaderDetails({ rwaMatch }: RWAIssuerHeaderDetailsProps): JSX.Element | null {
  const issuerLogoUrl = useRWAIssuerLogoUrl(rwaMatch?.token.issuer)

  if (!rwaMatch) {
    return null
  }

  const displayName = getRWAIssuerDisplayName(rwaMatch.token.issuer)
  const logoSize = iconSizes.icon16

  return (
    <Flex row shrink alignItems="center" gap="$spacing6">
      {issuerLogoUrl ? (
        <UniversalImage
          allowLocalUri
          size={{ height: logoSize, width: logoSize }}
          style={{ image: { borderRadius: logoSize } }}
          uri={issuerLogoUrl}
        />
      ) : null}
      <Text color="$neutral2" numberOfLines={1} variant="body3">
        {displayName}
      </Text>
    </Flex>
  )
}
