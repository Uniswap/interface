import { useTranslation } from 'react-i18next'
import { Flex, Text, UniversalImage } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { getRWAIssuerDisplayName } from 'uniswap/src/features/rwa/issuers'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useRWAIssuerLogoUrl } from 'uniswap/src/features/rwa/useRWAIssuerLogoUrl'

interface RWAIssuerHeaderDetailsProps {
  rwaMatch?: RWAMatch
}

export function RWAIssuerHeaderDetails({ rwaMatch }: RWAIssuerHeaderDetailsProps): JSX.Element | null {
  const { t } = useTranslation()
  const issuerLogoUrl = useRWAIssuerLogoUrl(rwaMatch?.token.issuer)

  if (!rwaMatch) {
    return null
  }

  const displayName = getRWAIssuerDisplayName(rwaMatch.token.issuer)
  const logoSize = iconSizes.icon20

  return (
    <>
      <Flex row alignItems="center" gap="$gap8">
        {issuerLogoUrl ? (
          <UniversalImage
            allowLocalUri
            size={{ height: logoSize, width: logoSize }}
            style={{ image: { borderRadius: logoSize } }}
            uri={issuerLogoUrl}
          />
        ) : null}
        <Text variant="body2" color="$neutral2" whiteSpace="nowrap">
          {t('tdp.rwa.issuedBy', { issuer: displayName })}
        </Text>
      </Flex>
      <Flex width={1} backgroundColor="$surface3" mx="$spacing12" alignSelf="stretch" />
    </>
  )
}
