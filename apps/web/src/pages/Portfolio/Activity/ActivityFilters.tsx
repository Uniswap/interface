import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, useMedia } from 'ui/src'
import { Calendar } from 'ui/src/components/icons/Calendar'
import { Filter } from 'ui/src/components/icons/Filter'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { DropdownSelector } from '~/components/Dropdowns/DropdownSelector'
import { getTimePeriodFilterOptions, getTransactionTypeFilterOptions } from '~/pages/Portfolio/Activity/Filters/utils'
import { SearchInput } from '~/pages/Portfolio/components/SearchInput'

const DROPDOWN_MIN_WIDTH = {
  transactionType: 220,
  timePeriod: 200,
}

interface ActivityFiltersProps {
  selectedTransactionType: string
  onTransactionTypeChange: (value: string) => void
  selectedTimePeriod: string
  onTimePeriodChange: (value: string) => void
  searchText: string
  onSearchTextChange: (value: string) => void
}

function ActivityFiltersInner({
  selectedTransactionType,
  onTransactionTypeChange,
  selectedTimePeriod,
  onTimePeriodChange,
  searchText,
  onSearchTextChange,
}: ActivityFiltersProps): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
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
            dataTestId={TestID.PortfolioActivityTransactionTypeFilter}
            optionTestIdPrefix={TestID.PortfolioActivityFilterOptionPrefix}
            buttonStyle={{ minWidth: 140, $md: { width: '100%' } }}
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
            buttonStyle={{ minWidth: 140, $md: { width: '100%' } }}
            dropdownStyle={{ minWidth: DROPDOWN_MIN_WIDTH.timePeriod }}
          />
        </Trace>
      </Flex>

      <SearchInput
        value={searchText}
        onChangeText={onSearchTextChange}
        dataTestId={TestID.PortfolioActivitySearchInput}
        placeholder={t('tokens.table.search.placeholder.activity')}
        width={media.md ? '100%' : undefined}
      />
    </Flex>
  )
}

export const ActivityFilters = memo(ActivityFiltersInner)
