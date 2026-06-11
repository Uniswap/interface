import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { SingleSelectContextMenu, type SingleSelectOption } from 'uniswap/src/components/menus/SingleSelectContextMenu'

export enum PositionStatusFilterValue {
  All = 'all',
  Open = 'open',
  Closed = 'closed',
}

/** Maps a filter selection to the `PositionStatus[]` passed to the positions query. */
export const POSITION_STATUS_FILTER_TO_STATUSES: Record<PositionStatusFilterValue, PositionStatus[]> = {
  [PositionStatusFilterValue.All]: [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE, PositionStatus.CLOSED],
  [PositionStatusFilterValue.Open]: [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE],
  [PositionStatusFilterValue.Closed]: [PositionStatus.CLOSED],
}

/** Shared "Status" row: a label plus a pill that opens the Open/Closed/All single-select dropdown. */
export function PositionStatusFilter({
  value,
  onChange,
  disabled,
}: {
  value: PositionStatusFilterValue
  onChange: (value: PositionStatusFilterValue) => void
  disabled?: boolean
}): JSX.Element {
  const { t } = useTranslation()

  const labelByValue = useMemo<Record<PositionStatusFilterValue, string>>(
    () => ({
      [PositionStatusFilterValue.All]: t('common.all'),
      [PositionStatusFilterValue.Open]: t('common.open'),
      [PositionStatusFilterValue.Closed]: t('common.closed'),
    }),
    [t],
  )

  const options = useMemo<SingleSelectOption<PositionStatusFilterValue>[]>(
    () => [
      { value: PositionStatusFilterValue.Open, label: labelByValue[PositionStatusFilterValue.Open] },
      { value: PositionStatusFilterValue.Closed, label: labelByValue[PositionStatusFilterValue.Closed] },
      { value: PositionStatusFilterValue.All, label: labelByValue[PositionStatusFilterValue.All] },
    ],
    [labelByValue],
  )

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      px="$spacing8"
      opacity={disabled ? 0.4 : 1}
      pointerEvents={disabled ? 'none' : 'auto'}
    >
      <Text variant="body3" color="$neutral1">
        {t('common.status')}
      </Text>
      <SingleSelectContextMenu options={options} selectedValue={value} onSelect={onChange}>
        <TouchableArea
          row
          alignItems="center"
          alignSelf="flex-end"
          flexShrink={0}
          gap="$spacing4"
          borderColor="$surface3"
          borderWidth="$spacing1"
          borderRadius="$roundedFull"
          pl="$spacing12"
          pr="$spacing8"
          py="$spacing6"
        >
          <Text variant="buttonLabel4" color="$neutral1" numberOfLines={1} flexShrink={0}>
            {labelByValue[value]}
          </Text>
          <RotatableChevron direction="down" size="$icon.16" color="$neutral2" />
        </TouchableArea>
      </SingleSelectContextMenu>
    </Flex>
  )
}
