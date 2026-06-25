import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { spacing } from 'ui/src/theme'
import { SingleSelectContextMenu, type SingleSelectOption } from 'uniswap/src/components/menus/SingleSelectContextMenu'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

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

/** Standalone Open/Closed/All filter pill. {@link PositionStatusFilter} composes this with a "Status" label. */
export function PositionStatusFilterButton({
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
    <SingleSelectContextMenu
      dimBackground
      options={options}
      selectedValue={value}
      offsetY={spacing.spacing8}
      disabled={disabled}
      onSelect={onChange}
    >
      {({ isOpen }) => (
        <Flex
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
          cursor="pointer"
          opacity={disabled ? 0.4 : 1}
          pointerEvents={disabled ? 'none' : 'auto'}
          testID={TestID.PoolsStatusFilter}
        >
          <Text variant="buttonLabel4" color="$neutral1" numberOfLines={1} flexShrink={0}>
            {labelByValue[value]}
          </Text>
          <RotatableChevron animation="200ms" direction={isOpen ? 'up' : 'down'} size="$icon.16" color="$neutral2" />
        </Flex>
      )}
    </SingleSelectContextMenu>
  )
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
      <PositionStatusFilterButton value={value} onChange={onChange} />
    </Flex>
  )
}
