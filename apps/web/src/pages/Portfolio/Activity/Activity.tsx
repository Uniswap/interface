import { DropdownSelector } from 'components/Dropdowns/DropdownSelector'
import { getTimePeriodFilterOptions, getTransactionTypeFilterOptions } from 'pages/Portfolio/Activity/Filters/utils'
import { SearchInput } from 'pages/Portfolio/components/SearchInput'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Calendar } from 'ui/src/components/icons/Calendar'
import { Filter } from 'ui/src/components/icons/Filter'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

const DROPDOWN_MIN_WIDTH = {
  transactionType: 220,
  timePeriod: 200,
}

export default function PortfolioActivity() {
  const { t } = useTranslation()
  const transactionTypeOptions = getTransactionTypeFilterOptions(t)
  const timePeriodOptions = getTimePeriodFilterOptions(t)
  const [selectedTransactionType, setSelectedTransactionType] = useState('all')
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('all')
  const [searchValue, setSearchValue] = useState('')
  const [filterTypeExpanded, setFilterTypeExpanded] = useState(false)
  const [timePeriodExpanded, setTimePeriodExpanded] = useState(false)

  return (
    <Trace logImpression page={InterfacePageName.PortfolioActivityPage}>
      <Flex gap="$spacing16">
        {/* Filtering Controls */}
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
          {/* Left side - Dropdown filters */}
          <Flex row gap="$spacing12" $md={{ justifyContent: 'space-between' }}>
            {/* Transaction Type Filter */}
            <DropdownSelector
              options={transactionTypeOptions}
              selectedValue={selectedTransactionType}
              onSelect={setSelectedTransactionType}
              isOpen={filterTypeExpanded}
              toggleOpen={setFilterTypeExpanded}
              ButtonIcon={Filter}
              dropdownStyle={{ minWidth: DROPDOWN_MIN_WIDTH.transactionType }}
            />

            {/* Time Period Filter */}
            <DropdownSelector
              options={timePeriodOptions}
              selectedValue={selectedTimePeriod}
              onSelect={setSelectedTimePeriod}
              isOpen={timePeriodExpanded}
              toggleOpen={setTimePeriodExpanded}
              ButtonIcon={Calendar}
              dropdownStyle={{ minWidth: DROPDOWN_MIN_WIDTH.timePeriod }}
            />
          </Flex>

          {/* Right side - Search bar */}
          <SearchInput value={searchValue} onChangeText={setSearchValue} placeholder="Search activity" width={280} />
        </Flex>

        <Flex
          padding="$spacing24"
          centered
          gap="$gap16"
          borderRadius="$rounded12"
          borderColor="$surface3"
          borderWidth="$spacing1"
          borderStyle="solid"
        >
          <Text variant="subheading1">Coming Soon</Text>
          <Text variant="body2" color="$neutral2">
            This feature is under development and will be available soon.
          </Text>
        </Flex>
      </Flex>
    </Trace>
  )
}
