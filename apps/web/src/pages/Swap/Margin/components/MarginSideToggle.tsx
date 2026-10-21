import { Text } from '@universe/mycelium'
import { SegmentedControl, type SegmentedControlOption } from '@universe/mycelium/segmented-control-compat'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginSide } from 'uniswap/src/features/transactions/margin/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'

// Sides the registry can actually serve. Empty while markets are loading (or after a failed fetch),
// which the toggle reads as "offer both" rather than greying itself out mid-load.
function useAvailableMarginSides(): ReadonlySet<MarginSide> {
  const { groups } = useMarginMarkets()
  return useMemo(
    () => new Set(groups.map((group): MarginSide => (group.direction === 'SHORT' ? 'short' : 'long'))),
    [groups],
  )
}

export function MarginSideToggle(): JSX.Element {
  const { t } = useTranslation()
  const side = useMarginFormStore((s) => s.side)
  const { setMarginFormState } = useMarginFormStoreActions()
  const availableSides = useAvailableMarginSides()

  const onSelectOption = useEvent((option: MarginSide) => {
    setMarginFormState({ side: option })
  })

  // A side with no groups is disabled, never dropped: SegmentedControl asserts on fewer than two
  // options, and a control that changes width as markets resolve would jump under the cursor. The
  // selected side stays enabled regardless, so the control can always render its own selection.
  const buildOption = ({ value, label }: { value: MarginSide; label: string }): SegmentedControlOption<MarginSide> => {
    const disabled = availableSides.size > 0 && value !== side && !availableSides.has(value)
    return {
      value,
      disabled,
      // A custom `display` bypasses SegmentedControl's own text colors, so the unavailable side has to
      // dim itself or it reads identical to a selectable one.
      display: (
        <Text variant="buttonLabel3" color={disabled ? '$neutral3' : value === side ? '$neutral1' : '$neutral2'}>
          {label}
        </Text>
      ),
    }
  }

  const options: SegmentedControlOption<MarginSide>[] = [
    buildOption({ value: 'long', label: t('margin.side.long') }),
    buildOption({ value: 'short', label: t('margin.side.short') }),
  ]

  return <SegmentedControl options={options} selectedOption={side} onSelectOption={onSelectOption} fullWidth />
}
