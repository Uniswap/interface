import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useTranslation } from 'react-i18next'
import { SegmentedControl } from 'ui/src'
import { DEFAULT_LP_POSITION_STATUS_FILTER } from '~/features/Liquidity/constants'

type ChipFilter = 'all' | 'in_range' | 'out_of_range'

function deriveActiveChip(statusFilter: PositionStatus[]): ChipFilter {
  if (statusFilter.length === 1 && statusFilter[0] === PositionStatus.IN_RANGE) {
    return 'in_range'
  }
  if (statusFilter.length === 1 && statusFilter[0] === PositionStatus.OUT_OF_RANGE) {
    return 'out_of_range'
  }
  return 'all'
}

export function PositionsStatusChips({
  statusFilter,
  setStatusFilter,
}: {
  statusFilter: PositionStatus[]
  setStatusFilter: (statuses: PositionStatus[]) => void
}): JSX.Element {
  const { t } = useTranslation()

  const options = [
    { value: 'all' as ChipFilter, displayText: t('common.all') },
    { value: 'in_range' as ChipFilter, displayText: t('common.withinRange') },
    { value: 'out_of_range' as ChipFilter, displayText: t('common.outOfRange') },
  ]

  const onSelect = (chip: ChipFilter): void => {
    if (chip === 'in_range') {
      setStatusFilter([PositionStatus.IN_RANGE])
      return
    }
    if (chip === 'out_of_range') {
      setStatusFilter([PositionStatus.OUT_OF_RANGE])
      return
    }
    setStatusFilter([...DEFAULT_LP_POSITION_STATUS_FILTER])
  }

  return (
    <SegmentedControl
      options={options}
      selectedOption={deriveActiveChip(statusFilter)}
      outlined={false}
      size="large"
      onSelectOption={onSelect}
    />
  )
}
