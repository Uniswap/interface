import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { GlobeFilled } from 'ui/src/components/icons/GlobeFilled'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { openUri } from 'uniswap/src/utils/linking'

/**
 * Blocked-state banner for the LP flows. Reuses PermissionedPoolBanner's geometry (that is the
 * agreed design language for a gated LP form) but the whole banner opens the geo help article
 * instead of a verification sheet: unlike a permissioned pool there is no escape hatch, so the copy
 * states the outcome rather than offering an action.
 */
export function LPGeoRestrictionBanner({ tokenSymbol }: { tokenSymbol?: string }): JSX.Element {
  const { t } = useTranslation()

  const heading = tokenSymbol
    ? t('liquidity.geoRestriction.banner.heading', { tokenSymbol })
    : t('liquidity.geoRestriction.banner.headingGeneric')

  const openGeoRestrictionHelp = (): Promise<void> => openUri({ uri: UniswapHelpUrls.articles.geoRestriction })

  return (
    <TouchableArea aria-label={heading} accessibilityLabel={heading} onPress={openGeoRestrictionHelp}>
      <Flex
        row
        backgroundColor="$surface2"
        borderRadius="$rounded12"
        p="$padding12"
        gap="$spacing12"
        alignItems="flex-start"
        data-testid={TestID.LPGeoRestrictionBanner}
      >
        {/* The text column's flex basis is its max-content width, so the row overflows and the
            shrink lands on the icons — an SVG's min-content is 0, so they collapse rather than hold
            their 20px. `flexShrink={0}` on each pins them. */}
        <GlobeFilled size="$icon.20" color="$neutral2" flexShrink={0} />
        <Flex flex={1} gap="$spacing2">
          <Text variant="body3" color="$neutral1">
            {heading}
          </Text>
          <Text variant="body3" color="$neutral2">
            {t('liquidity.geoRestriction.banner.description')}
          </Text>
        </Flex>
        <InfoCircle size="$icon.20" color="$neutral3" flexShrink={0} />
      </Flex>
    </TouchableArea>
  )
}
