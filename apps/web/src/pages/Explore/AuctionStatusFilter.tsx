import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { ModalName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { Dropdown, InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import {
  AuctionStatusFilter as AuctionStatusFilterEnum,
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/pages/Explore/exploreTablesFilterStore'

export function AuctionStatusFilter() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const selectedFilter = useExploreTablesFilterStore((s) => s.statusFilter)
  const { setStatusFilter: setSelectedFilter } = useExploreTablesFilterStoreActions()
  const media = useMedia()

  const onFilterChange = useCallback(
    (filter: AuctionStatusFilterEnum) => {
      setSelectedFilter(filter)
      setOpen(false)
      sendAnalyticsEvent(UniswapEventName.AuctionFilterSelected, {
        filter,
      })
    },
    [setSelectedFilter],
  )

  const getFilterLabel = useCallback(
    (filter: AuctionStatusFilterEnum) => {
      switch (filter) {
        case AuctionStatusFilterEnum.All:
          return t('common.all')
        case AuctionStatusFilterEnum.Active:
          return t('toucan.filter.active')
        case AuctionStatusFilterEnum.Complete:
          return t('toucan.auction.timeRemaining.completed')
      }
      throw new Error(`Unknown filter: ${filter}`)
    },
    [t],
  )

  const filterOptions = useMemo(() => {
    return Object.values(AuctionStatusFilterEnum).map((option) => (
      <InternalMenuItem key={`AuctionStatusFilter-${option}`} onPress={() => onFilterChange(option)}>
        {getFilterLabel(option)}
        {selectedFilter === option && <Check size="$icon.16" color="$accent1" />}
      </InternalMenuItem>
    ))
  }, [selectedFilter, onFilterChange, getFilterLabel])

  return (
    <Flex>
      <Trace modal={ModalName.ExploreStatusFilter}>
        <Dropdown
          isOpen={open}
          toggleOpen={() => setOpen((prev) => !prev)}
          menuLabel={
            <Text variant="buttonLabel3" width="max-content">
              {selectedFilter === AuctionStatusFilterEnum.All
                ? t('toucan.filter.status')
                : getFilterLabel(selectedFilter)}
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
