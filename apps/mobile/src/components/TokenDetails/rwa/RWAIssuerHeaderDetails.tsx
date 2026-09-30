import { Flex, iconSizes, Text, UniversalImage } from '@universe/mycelium'
import { getRWAIssuerLabel } from 'uniswap/src/features/rwa/issuers'
import type { RWAIssuerDisplay } from 'uniswap/src/features/rwa/types'
import { useRWAIssuerLogoUrl } from 'uniswap/src/features/rwa/useRWAIssuerLogoUrl'

type RWAIssuerHeaderDetailsProps = {
  issuer?: RWAIssuerDisplay
}

export function RWAIssuerHeaderDetails({ issuer }: RWAIssuerHeaderDetailsProps): JSX.Element | null {
  const configLogoUrl = useRWAIssuerLogoUrl(issuer?.issuer)
  const issuerLabel = issuer && getRWAIssuerLabel(issuer)

  if (!issuer || !issuerLabel) {
    return null
  }

  const issuerLogoUrl = issuer.issuerLogoUrl ?? configLogoUrl
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
        {issuerLabel}
      </Text>
    </Flex>
  )
}
