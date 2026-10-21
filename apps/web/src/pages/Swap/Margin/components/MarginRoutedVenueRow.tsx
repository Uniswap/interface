import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { TestID } from '@universe/test'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { useEvent } from 'utilities/src/react/hooks'
import { MarginVenueLogo } from '~/pages/Swap/Margin/components/MarginVenueLogo'
import {
  MarginVenuePreferencesModal,
  useActiveMarginPairGroup,
} from '~/pages/Swap/Margin/components/MarginVenuePreferences'
import { marginVenueLabel } from '~/pages/Swap/Margin/marginFormat'

// Long enough to be noticed on a poll that lands while the user is reading, short enough that it is
// gone before it reads as permanent state.
const VENUE_CUE_MS = 2500

// Where the open would route right now, at the top of the rate area rather than buried in the route
// tooltip's step list — the venue is the counterparty, not an implementation detail of the route. The
// chip is also the third entry point into the opt-out sheet (the others being the market picker's
// per-pair cell and the ⚙︎ popover).
export function MarginRoutedVenueRow({ routedVenue }: { routedVenue?: MarginVenue }): JSX.Element {
  const { t } = useTranslation()
  const group = useActiveMarginPairGroup()
  const [isVenuesOpen, setIsVenuesOpen] = useState(false)
  const openVenues = useEvent(() => setIsVenuesOpen(true))
  const closeVenues = useEvent(() => setIsVenuesOpen(false))

  // Adjusted during render, not in an effect, so the first frame that names the new venue is the one
  // that highlights it — an effect would draw the new name un-cued for a frame.
  const [shownVenue, setShownVenue] = useState(routedVenue)
  const [hasJustChanged, setHasJustChanged] = useState(false)
  if (routedVenue !== shownVenue) {
    setShownVenue(routedVenue)
    // Arriving at the first venue is not a change, and neither is losing one: there is nothing the
    // user was looking at to move away from.
    setHasJustChanged(shownVenue !== undefined && routedVenue !== undefined)
  }
  // Keyed on shownVenue too, so a second re-route while the cue is up restarts it instead of
  // inheriting the running timer's remaining time.
  useEffect(() => {
    if (!hasJustChanged) {
      return undefined
    }
    const timer = setTimeout(() => setHasJustChanged(false), VENUE_CUE_MS)
    return () => clearTimeout(timer)
  }, [hasJustChanged, shownVenue])

  return (
    <Flex row justifyContent="space-between" alignItems="center" gap="$spacing12" py="$spacing4">
      <Text variant="body3" color="$neutral2">
        {t('margin.route.venueLabel')}
      </Text>
      <Flex row alignItems="center" gap="$spacing6" flexShrink={1} minWidth={0}>
        {hasJustChanged ? (
          <Text variant="body4" color="$accent1">
            {t('margin.route.venueChanged')}
          </Text>
        ) : null}
        <TouchableArea testID={TestID.MarginRoutedVenueChip} disabled={!group} onPress={openVenues}>
          <Flex
            row
            alignItems="center"
            gap="$spacing6"
            px="$spacing8"
            py="$spacing4"
            borderRadius="$roundedFull"
            backgroundColor="$surface2"
            borderWidth={1}
            // The ring snaps; only the pop is animated. Scoped to `transform` so the `$` color
            // tokens (borderColor) don't transition — an unscoped transition flashes on a theme switch.
            borderColor={hasJustChanged ? '$accent1' : '$surface3'}
            style={{ transition: `transform ${SPORE_ANIMATION_CURVE_CSS.fast}` }}
            scale={hasJustChanged ? 1.04 : 1}
          >
            {routedVenue ? <MarginVenueLogo venue={routedVenue} /> : null}
            <Text variant="body3" color="$neutral1">
              {routedVenue ? marginVenueLabel(routedVenue) : t('margin.route.autoBest')}
            </Text>
            <RotatableChevron direction="right" size="$icon.16" color="$neutral3" />
          </Flex>
        </TouchableArea>
      </Flex>
      {isVenuesOpen && group ? <MarginVenuePreferencesModal group={group} isOpen onClose={closeVenues} /> : null}
    </Flex>
  )
}
