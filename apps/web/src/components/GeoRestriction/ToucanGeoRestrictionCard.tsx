import { useTranslation } from 'react-i18next'
import { InlineCard, Text, TouchableArea } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { GlobeFilled } from 'ui/src/components/icons/GlobeFilled'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { openUri } from 'uniswap/src/utils/linking'

/**
 * Supply-side geo-restriction info card for CCA (create-auction + bidding). Mirrors the swap
 * GeoRestrictionCard visually but is decoupled from the swap store and opens the help article
 * directly — there is no bypass on the supply side (LP-946).
 */
export function ToucanGeoRestrictionCard({ tokenSymbol }: { tokenSymbol?: string }): JSX.Element {
  const { t } = useTranslation()

  const description = tokenSymbol
    ? t('toucan.geoRestriction.someRegions.description', { tokenSymbol })
    : t('toucan.geoRestriction.someRegions.descriptionGeneric')

  const openGeoRestrictionHelp = (): Promise<void> => openUri({ uri: UniswapHelpUrls.articles.geoRestriction })

  // Single press target: the whole card opens the help article. Don't add onPressCtaButton to the
  // InlineCard — its CTA button is its own TouchableArea and would double-fire with this onPress.
  return (
    <TouchableArea testID={TestID.ToucanGeoRestrictionCard} onPress={openGeoRestrictionHelp}>
      <InlineCard
        padding="$spacing16"
        iconSize="$icon.16"
        CtaButtonIcon={ExternalLink}
        CtaButtonIconColor="$neutral2"
        Icon={GlobeFilled}
        color="$neutral2"
        iconColor="$neutral2"
        backgroundColor="$surface2"
        description={
          <Text color="$neutral2" variant="body3">
            {description}
          </Text>
        }
      />
    </TouchableArea>
  )
}
