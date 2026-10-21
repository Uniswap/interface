import { Flex, iconSizes, Text, UniversalImage } from '@universe/mycelium'
import { getRWAIssuerLabel } from 'uniswap/src/features/rwa/issuers'
import type { RWAIssuerDisplay } from 'uniswap/src/features/rwa/types'
import { useRWAIssuerLogo } from 'uniswap/src/features/rwa/useRWAIssuerLogoUrl'

type RWAIssuerHeaderDetailsProps = {
  issuer?: RWAIssuerDisplay
}

export function RWAIssuerHeaderDetails({ issuer }: RWAIssuerHeaderDetailsProps): JSX.Element | null {
  const issuerLogoUrl = useRWAIssuerLogo({ issuer, variant: 'color' })
  const issuerLabel = issuer && getRWAIssuerLabel(issuer)

  if (!issuer || !issuerLabel) {
    return null
  }

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
