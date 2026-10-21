import { Flex, Text, UniversalImage, iconSizes } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { getRWAIssuerLabel } from 'uniswap/src/features/rwa/issuers'
import type { RWAIssuerDisplay } from 'uniswap/src/features/rwa/types'
import { useRWAIssuerLogo } from 'uniswap/src/features/rwa/useRWAIssuerLogoUrl'
import { HeaderDivider } from '~/components/StickyCollapsibleHeader/HeaderDivider'

interface RWAIssuerHeaderDetailsProps {
  issuer?: RWAIssuerDisplay
}

export function RWAIssuerHeaderDetails({ issuer }: RWAIssuerHeaderDetailsProps): JSX.Element | null {
  const { t } = useTranslation()
  const issuerLogoUrl = useRWAIssuerLogo({ issuer, variant: 'color' })
  const issuerLabel = issuer && getRWAIssuerLabel(issuer)

  if (!issuer || !issuerLabel) {
    return null
  }

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
