import { Flex, Text, UniversalImage, iconSizes } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { getRWAIssuerLabel } from 'uniswap/src/features/rwa/issuers'
import type { RWAIssuerDisplay } from 'uniswap/src/features/rwa/types'
import { useRWAIssuerLogoUrl } from 'uniswap/src/features/rwa/useRWAIssuerLogoUrl'
import { HeaderDivider } from '~/components/StickyCollapsibleHeader/HeaderDivider'

interface RWAIssuerHeaderDetailsProps {
  issuer?: RWAIssuerDisplay
}

export function RWAIssuerHeaderDetails({ issuer }: RWAIssuerHeaderDetailsProps): JSX.Element | null {
  const { t } = useTranslation()
  const configLogoUrl = useRWAIssuerLogoUrl(issuer?.issuer)
  const issuerLabel = issuer && getRWAIssuerLabel(issuer)

  if (!issuer || !issuerLabel) {
    return null
  }

  const issuerLogoUrl = issuer.issuerLogoUrl ?? configLogoUrl
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
          {t('tdp.rwa.issuedBy', { issuer: issuerLabel })}
        </Text>
      </Flex>
      <HeaderDivider alignSelf="stretch" />
    </>
  )
}
