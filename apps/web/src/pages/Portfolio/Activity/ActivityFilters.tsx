import { DropdownSelector } from 'components/Dropdowns/DropdownSelector'
import { getTimePeriodFilterOptions, getTransactionTypeFilterOptions } from 'pages/Portfolio/Activity/Filters/utils'
import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { Calendar } from 'ui/src/components/icons/Calendar'
import { Filter } from 'ui/src/components/icons/Filter'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

const DROPDOWN_MIN_WIDTH = {
  transactionType: 220,
  timePeriod: 200,
}

interface ActivityFiltersProps {
  selectedTransactionType: string
  onTransactionTypeChange: (value: string) => void
  selectedTimePeriod: string
  onTimePeriodChange: (value: string) => void
}

function _ActivityFilters({
  selectedTransactionType,
  onTransactionTypeChange,
  selectedTimePeriod,
  onTimePeriodChange,
}: ActivityFiltersProps): JSX.Element {
  const { t } = useTranslation()
  const transactionTypeOptions = useMemo(() => getTransactionTypeFilterOptions(t), [t])
  const timePeriodOptions = useMemo(() => getTimePeriodFilterOptions(t), [t])

  const [filterTypeExpanded, setFilterTypeExpanded] = useState(false)
  const [timePeriodExpanded, setTimePeriodExpanded] = useState(false)

  return (
    <Flex
      row
      justifyContent="space-between"
      alignItems="center"
      gap="$spacing12"
      $md={{
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '$spacing16',
      }}
    >
      <Flex row gap="$spacing12" $md={{ flexDirection: 'column' }}>
        {/* Transaction Type Filter */}
        <Trace logPress element={ElementName.ActivityFilterTransactionType}>
          <DropdownSelector
            options={transactionTypeOptions}
            selectedValue={selectedTransactionType}
            onSelect={onTransactionTypeChange}
            isOpen={filterTypeExpanded}
            toggleOpen={setFilterTypeExpanded}
            ButtonIcon={Filter}
            buttonStyle={{ minWidth: 'auto', $md: { width: '100%' } }}
            dropdownStyle={{ minWidth: DROPDOWN_MIN_WIDTH.transactionType }}
          />
        </Trace>
        {/* Time Period Filter */}
        <Trace logPress element={ElementName.ActivityFilterTimePeriod}>
          <DropdownSelector
            options={timePeriodOptions}
            selectedValue={selectedTimePeriod}
            onSelect={onTimePeriodChange}
            isOpen={timePeriodExpanded}
            toggleOpen={setTimePeriodExpanded}
            ButtonIcon={Calendar}
            buttonStyle={{ width: 140, $md: { width: '100%' } }}
            dropdownStyle={{ minWidth: DROPDOWN_MIN_WIDTH.timePeriod }}
          />
        </Trace>
      </Flex>

      {/* TODO(PORT-596): Add server-side search functionality */}
    </Flex>
  )
}

export const ActivityFilters = memo(_ActivityFilters)
