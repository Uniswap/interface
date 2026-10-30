import { normalizeTokenAddressForCache } from '@universe/chains'
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
import type { MarginMarket, MarginPairGroup } from '~/constants/margin'
import { useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'
import { marginMarketDirection, marginPairLegs } from '~/pages/Swap/Margin/marginTokenDisplay'

const MARGIN_DIRECTIONS = [MarginDirection.LONG, MarginDirection.SHORT] as const

const SELECTED_SIDE_COLOR = {
  [MarginDirection.LONG]: '$statusSuccess',
  [MarginDirection.SHORT]: '$statusCritical',
} as const

function sameAddress(a: string, b: string): boolean {
  return normalizeTokenAddressForCache(a) === normalizeTokenAddressForCache(b)
}

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

  // A custom `display` bypasses SegmentedControl's own text colors, so the label carries the side
  // color when selected and dims itself when unavailable.
  const options: SegmentedControlOption<MarginDirection>[] = MARGIN_DIRECTIONS.map((direction) => {
    const disabled = disabledDirections.has(direction)
    const color = disabled
      ? '$neutral3'
      : direction === selectedDirection
        ? SELECTED_SIDE_COLOR[direction]
        : '$neutral2'
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
      size="large"
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

// The group a side switch on the form lands on: the same pair the other way round when the registry
// lists it, else the same base token against another quote. Undefined means the base token doesn't
// trade on that side at all, which is what disables the segment.
export function findMarginSideCounterpart({
  groups,
  market,
  direction,
}: {
  groups: MarginPairGroup[]
  market: MarginMarket
  direction: MarginDirection
}): MarginPairGroup | undefined {
  const { base, quote } = marginPairLegs(market)
  const sameBase = groups.filter(
    (group) => group.direction === direction && sameAddress(group.base.address, base.address),
  )
  return sameBase.find((group) => sameAddress(group.quote.address, quote.address)) ?? sameBase.at(0)
}

// Top-of-form toggle. The form's market is keyed by pair, and a pair's long and short are different
// pairs (collateral and debt swap roles), so switching side switches pair. The selected segment reads
// the displayed market's own direction rather than the stored `side`, which the selector modal can
// move on its own while browsing.
export function MarginFormSideToggle({ market }: { market: MarginMarket }): JSX.Element {
  const { groups } = useMarginMarkets()
  const { setMarginFormState } = useMarginFormStoreActions()
  const selectedDirection =
    market.direction ??
    marginMarketDirection({ collateralToken: market.collateral.address, debtToken: market.debt.address })

  const counterparts = useMemo(
    () =>
      new Map(
        MARGIN_DIRECTIONS.map((direction) => [direction, findMarginSideCounterpart({ groups, market, direction })]),
      ),
    [groups, market],
  )
  // Nothing is known before the registry lands, so neither side is greyed out on the way in.
  const disabledDirections = useMemo(
    () =>
      new Set(
        MARGIN_DIRECTIONS.filter(
          (direction) => groups.length > 0 && direction !== selectedDirection && !counterparts.get(direction),
        ),
      ),
    [groups.length, selectedDirection, counterparts],
  )

  const onSelect = useEvent((direction: MarginDirection) => {
    const target = counterparts.get(direction)
    if (direction === selectedDirection || !target) {
      return
    }
    // Clear any explicit payment selection: each side defaults to paying in its own collateral.
    setMarginFormState({
      pairKey: target.pairKey,
      side: direction,
      paymentToken: undefined,
    })
  })

  return (
    <MarginSideSegmentedControl
      selectedDirection={selectedDirection}
      disabledDirections={disabledDirections}
      onSelect={onSelect}
    />
  )
}
