import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { MarginVenueLogo } from '~/pages/Swap/Margin/components/MarginVenueLogo'
import { marginVenueLabel } from '~/pages/Swap/Margin/marginFormat'

// A position's venue is fixed at open; the opt-out preference only governs where a NEW open routes.
// So a user who switches a venue off can still be holding a position on it — this says so rather than
// letting the two surfaces quietly contradict each other. Informational only: it never blocks a manage
// action, since refusing to manage a position would be strictly worse than the state it describes.
export function MarginExcludedVenueNotice({ venue }: { venue: MarginVenue }): JSX.Element | null {
  const { t } = useTranslation()
  const excludedVenues = useMarginFormStore((s) => s.excludedVenues)

  if (!excludedVenues.includes(venue)) {
    return null
  }

  return (
    <Flex
      row
      alignItems="center"
      gap="$spacing8"
      p="$spacing12"
      borderRadius="$rounded12"
      backgroundColor="$surface2"
      testID={TestID.MarginPositionVenueExcluded}
    >
      <MarginVenueLogo venue={venue} />
      <Text variant="body4" color="$neutral2" flexShrink={1} minWidth={0}>
        {t('margin.manage.venueExcluded', { venue: marginVenueLabel(venue) })}
      </Text>
    </Flex>
  )
}
