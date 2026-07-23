import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { ModalName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { Dropdown, InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import {
  AuctionQuickFilter,
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'

/** Status options exposed by the dropdown; shares the AuctionQuickFilter dimension with the pills. */
const STATUS_OPTIONS = [AuctionQuickFilter.All, AuctionQuickFilter.Active, AuctionQuickFilter.Completed] as const

export function AuctionStatusFilter() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const selectedFilter = useExploreTablesFilterStore((s) => s.quickFilter)
  const { setQuickFilter: setSelectedFilter } = useExploreTablesFilterStoreActions()
  const media = useMedia()

  const onFilterChange = useCallback(
    (filter: AuctionQuickFilter) => {
      setSelectedFilter(filter)
      setOpen(false)
      sendAnalyticsEvent(UniswapEventName.AuctionFilterSelected, {
        filter,
      })
    },
    [setSelectedFilter],
  )

  const getFilterLabel = useCallback(
    (filter: AuctionQuickFilter) => {
      switch (filter) {
        case AuctionQuickFilter.Active:
          return t('toucan.filter.active')
        case AuctionQuickFilter.Completed:
          return t('toucan.auction.timeRemaining.completed')
        default:
          return t('common.all')
      }
    },
    [t],
  )

  const filterOptions = useMemo(() => {
    return STATUS_OPTIONS.map((option) => (
      <InternalMenuItem key={`AuctionStatusFilter-${option}`} onPress={() => onFilterChange(option)}>
        {getFilterLabel(option)}
        {selectedFilter === option && <Check size="$icon.16" color="$accent1" />}
      </InternalMenuItem>
    ))
  }, [selectedFilter, onFilterChange, getFilterLabel])

  // Pill-only selections (Verified / New) aren't statuses, so the trigger keeps its generic label for them.
  const isStatusSelection =
    selectedFilter === AuctionQuickFilter.Active || selectedFilter === AuctionQuickFilter.Completed

  return (
    <Flex>
      <Trace modal={ModalName.ExploreStatusFilter}>
        <Dropdown
          isOpen={open}
          toggleOpen={() => setOpen((prev) => !prev)}
          menuLabel={
            <Text variant="buttonLabel3" width="max-content">
              {isStatusSelection ? getFilterLabel(selectedFilter) : t('toucan.filter.status')}
            </Text>
          }
          dropdownStyle={{ width: 160 }}
          buttonStyle={{ height: 40, width: 'max-content' }}
          allowFlip
          alignRight={!media.lg}
        >
          {filterOptions}
        </Dropdown>
      </Trace>
    </Flex>
  )
}
