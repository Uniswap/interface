import { Flex } from '@universe/mycelium'
import { Edit } from '@universe/mycelium/icons/Edit'
import { useTranslation } from 'react-i18next'
import { SingleSelectContextMenu, type SingleSelectOption } from 'uniswap/src/components/menus/SingleSelectContextMenu'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { useEvent } from 'utilities/src/react/hooks'
import { formatBorrowRate, marginVenueLabel } from '~/features/margin/utils/marginFormat'
import { useActiveMarginPairGroup } from '~/pages/Swap/Margin/components/MarginVenuePreferences'

type VenueChoice = MarginVenue | 'AUTO'

// ✎ on the receipt's Market row: pins the open to one of the pair's venues, or back to Auto (the server
// routes over the allowlist). Hidden when there is nothing to choose between.
export function MarginVenuePickerButton(): JSX.Element | null {
  const { t } = useTranslation()
  const group = useActiveMarginPairGroup()
  const excludedVenues = useMarginFormStore((s) => s.excludedVenues)
  const pin = useMarginFormStore((s) => s.pinnedVenue)
  const { setMarginFormState } = useMarginFormStoreActions()

  const onSelect = useEvent((value: VenueChoice) => {
    setMarginFormState({
      pinnedVenue: value === 'AUTO' || !group ? undefined : { pairKey: group.pairKey, venue: value },
    })
  })

  const pairs = group?.pairs.filter((pair) => !excludedVenues.includes(pair.venue)) ?? []
  if (!group || pairs.length < 2) {
    return null
  }
  // Same rule as useMarginVenueAllowlist: a pin counts only on its own pair, for an allowed venue.
  const pinnedVenue =
    pin?.pairKey === group.pairKey && pairs.some((pair) => pair.venue === pin.venue) ? pin.venue : undefined

  const options: SingleSelectOption<VenueChoice>[] = [
    { value: 'AUTO', label: t('margin.route.autoBest') },
    ...pairs.map((pair) => ({
      value: pair.venue,
      label: `${marginVenueLabel(pair.venue)} · ${formatBorrowRate(pair.borrowRateBps)}`,
    })),
  ]

  return (
    <SingleSelectContextMenu
      isPlacementAbove
      options={options}
      selectedValue={pinnedVenue ?? 'AUTO'}
      onSelect={onSelect}
    >
      <Flex
        role="button"
        aria-label={t('common.button.edit')}
        p="$spacing2"
        borderRadius="$rounded4"
        cursor="pointer"
        hoverStyle={{ backgroundColor: '$surface3' }}
      >
        <Edit size="$icon.12" color="$neutral2" />
      </Flex>
    </SingleSelectContextMenu>
  )
}
