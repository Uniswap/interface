import { Text } from '@universe/mycelium'
import { SegmentedControl, type SegmentedControlOption } from '@universe/mycelium/segmented-control-compat'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useMarginMarkets } from '~/features/margin/hooks/useMarginMarkets'

const MARGIN_DIRECTIONS = [MarginDirection.LONG, MarginDirection.SHORT] as const

// Directions the registry can actually serve. Empty while markets are loading (or after a failed
// fetch), which the toggle reads as "offer both" rather than greying itself out mid-load.
function useAvailableMarginDirections(): ReadonlySet<MarginDirection> {
  const { groups } = useMarginMarkets()
  return useMemo(() => new Set(groups.map((group) => group.direction)), [groups])
}

// A side that can't be served is disabled, never dropped: SegmentedControl asserts on fewer than two
// options, and a control that changes width as markets resolve would jump under the cursor.
function MarginSideSegmentedControl({
  selectedDirection,
  disabledDirections,
  onSelect,
}: {
  selectedDirection: MarginDirection
  disabledDirections: ReadonlySet<MarginDirection>
  onSelect: (direction: MarginDirection) => void
}): JSX.Element {
  const { t } = useTranslation()
  const labels = { [MarginDirection.LONG]: t('margin.side.long'), [MarginDirection.SHORT]: t('margin.side.short') }

  // A custom `display` bypasses SegmentedControl's own text colors, so the label dims itself when
  // unavailable.
  const options: SegmentedControlOption<MarginDirection>[] = MARGIN_DIRECTIONS.map((direction) => {
    const disabled = disabledDirections.has(direction)
    const color = disabled ? '$neutral3' : direction === selectedDirection ? '$neutral1' : '$neutral2'
    return {
      value: direction,
      disabled,
      display: (
        <Text variant="buttonLabel3" color={color}>
          {labels[direction]}
        </Text>
      ),
    }
  })

  return (
    <SegmentedControl
      options={options}
      selectedOption={selectedDirection}
      onSelectOption={onSelect}
      size="default"
      fullWidth
    />
  )
}

// Selector-modal toggle: filters the pair list by side. Availability is registry-wide, so a user can
// browse the other side's pairs even when the current one only trades one way round.
export function MarginSideToggle(): JSX.Element {
  const selectedDirection = useMarginFormStore((s) => s.side)
  const { setMarginFormState } = useMarginFormStoreActions()
  const availableDirections = useAvailableMarginDirections()

  // A stored side the registry dropped stays enabled: the control has to be able to render its own
  // selection, and a disabled-yet-selected segment reads as broken.
  const disabledDirections = useMemo(
    () =>
      new Set(
        MARGIN_DIRECTIONS.filter(
          (direction) =>
            availableDirections.size > 0 && direction !== selectedDirection && !availableDirections.has(direction),
        ),
      ),
    [availableDirections, selectedDirection],
  )

  const onSelect = useEvent((direction: MarginDirection) => {
    setMarginFormState({ side: direction })
  })

  return (
    <MarginSideSegmentedControl
      selectedDirection={selectedDirection}
      disabledDirections={disabledDirections}
      onSelect={onSelect}
    />
  )
}
