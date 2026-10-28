import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Text } from '@universe/mycelium'
import { SegmentedControl } from '@universe/mycelium/segmented-control-compat'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'ui/src/components/icons/Check'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { PositionsRangeFilter as RangeFilter } from 'uniswap/src/features/telemetry/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { Dropdown, InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import { DEFAULT_LP_POSITION_STATUS_FILTER, deriveActiveRangeFilter } from '~/features/Liquidity/constants'

interface RangeFilterProps {
  statusFilter: PositionStatus[]
  setStatusFilter: (statuses: PositionStatus[]) => void
}

function toStatusFilter(filter: RangeFilter): PositionStatus[] {
  if (filter === 'in_range') {
    return [PositionStatus.IN_RANGE]
  }
  if (filter === 'out_of_range') {
    return [PositionStatus.OUT_OF_RANGE]
  }
  return [...DEFAULT_LP_POSITION_STATUS_FILTER]
}

function rangeFilterOptions(
  t: ReturnType<typeof useTranslation>['t'],
  allLabel: string,
): { value: RangeFilter; displayText: string }[] {
  return [
    { value: 'all', displayText: allLabel },
    { value: 'in_range', displayText: t('common.withinRange') },
    { value: 'out_of_range', displayText: t('common.outOfRange') },
  ]
}

function useRangeFilterSelection({ statusFilter, setStatusFilter }: RangeFilterProps): {
  activeFilter: RangeFilter
  selectFilter: (filter: RangeFilter) => void
} {
  const trace = useTrace()
  const activeFilter = deriveActiveRangeFilter(statusFilter)
  // Same-tick repeat guard: InternalMenuItem.onPress has no single-dispatch pin; activeFilter is fixed within a tick.
  const lastSelectedRef = useRef(activeFilter)
  lastSelectedRef.current = activeFilter

  const selectFilter = (filter: RangeFilter): void => {
    if (filter !== lastSelectedRef.current) {
      sendAnalyticsEvent(UniswapEventName.PoolsRangeFilterSelected, { filter, ...trace })
      lastSelectedRef.current = filter
    }
    setStatusFilter(toStatusFilter(filter))
  }

  return { activeFilter, selectFilter }
}

export function PositionsStatusChips({ statusFilter, setStatusFilter }: RangeFilterProps): JSX.Element {
  const { t } = useTranslation()
  const { activeFilter, selectFilter } = useRangeFilterSelection({ statusFilter, setStatusFilter })

  const options = rangeFilterOptions(t, t('common.all'))

  return (
    <SegmentedControl
      options={options}
      selectedOption={activeFilter}
      outlined={false}
      size="large"
      onSelectOption={selectFilter}
    />
  )
}

export function PositionsRangeFilterDropdown({ statusFilter, setStatusFilter }: RangeFilterProps): JSX.Element {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const { activeFilter, selectFilter } = useRangeFilterSelection({ statusFilter, setStatusFilter })

  const options = rangeFilterOptions(t, t('pool.positions.filter.allPositions'))

  return (
    <Dropdown
      isOpen={isOpen}
      toggleOpen={() => setIsOpen((prev) => !prev)}
      menuLabel={
        <Text variant="buttonLabel3" color="$neutral1" whiteSpace="nowrap">
          {options.find((o) => o.value === activeFilter)?.displayText}
        </Text>
      }
      dropdownStyle={{ width: 200 }}
      containerStyle={{ width: 'fit-content' }}
      alignRight={false}
      buttonStyle={{
        borderRadius: '$roundedFull',
        py: '$padding8',
        px: '$padding12',
        borderWidth: 0,
        backgroundColor: '$surface3',
        hoverStyle: { backgroundColor: '$surface3Hovered' },
      }}
    >
      {options.map((option) => (
        <InternalMenuItem
          key={`PositionsRangeFilter-${option.value}`}
          onPress={() => {
            selectFilter(option.value)
            setIsOpen(false)
          }}
        >
          {option.displayText}
          {option.value === activeFilter && <Check size="$icon.16" color="$neutral1" />}
        </InternalMenuItem>
      ))}
    </Dropdown>
  )
}
