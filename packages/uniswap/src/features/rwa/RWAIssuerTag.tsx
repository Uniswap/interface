import { Flex, Text, iconSizes } from '@universe/mycelium'
import { memo } from 'react'
import { formatIssuerLabel } from 'uniswap/src/data/apiClients/dataApiService/rwa/formatIssuerDisplaySymbol'
import { GrayscaleIssuerLogo } from 'uniswap/src/features/rwa/GrayscaleIssuerLogo'
import type { RWAIssuer } from 'uniswap/src/features/rwa/types'
import { useRWAIssuerLogoUrl } from 'uniswap/src/features/rwa/useRWAIssuerLogoUrl'

const LOGO_SIZE = iconSizes.icon12

/** Filled counterpart of CategoryTagPill (no border, surface2 fill) so issuer and category read as different kinds. */
export const RWAIssuerTag = memo(function RWAIssuerTag({ issuer }: { issuer: RWAIssuer }): JSX.Element {
  const logoUrl = useRWAIssuerLogoUrl(issuer)

  return (
    <Flex
      row
      alignItems="center"
      alignSelf="center"
      gap="$spacing4"
      flexShrink={0}
      px="$spacing6"
      py="$spacing2"
      // Matches CategoryTagPill's border so both pills are the same height.
      borderWidth="$spacing1"
      borderColor="$surface2"
      backgroundColor="$surface2"
      borderRadius="$roundedFull"
    >
      {logoUrl ? <GrayscaleIssuerLogo uri={logoUrl} size={LOGO_SIZE} /> : null}
      <Text color="$neutral2" variant="body4" numberOfLines={1}>
        {formatIssuerLabel(issuer)}
      </Text>
    </Flex>
  )
})
