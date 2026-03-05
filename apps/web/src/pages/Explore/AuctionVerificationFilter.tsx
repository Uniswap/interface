import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip, useMedia } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { zIndexes } from 'ui/src/theme'
import { ModalName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { Dropdown, InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import {
  AuctionVerificationFilter as AuctionVerificationFilterEnum,
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/pages/Explore/exploreTablesFilterStore'

export function AuctionVerificationFilter() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const selectedFilter = useExploreTablesFilterStore((s) => s.verificationFilter)
  const { setVerificationFilter: setSelectedFilter } = useExploreTablesFilterStoreActions()
  const media = useMedia()

  const onFilterChange = useCallback(
    (filter: AuctionVerificationFilterEnum) => {
      setSelectedFilter(filter)
      setOpen(false)
      sendAnalyticsEvent(UniswapEventName.AuctionFilterSelected, {
        filter,
      })
    },
    [setSelectedFilter],
  )

  const getFilterLabel = useCallback(
    (filter: AuctionVerificationFilterEnum) => {
      switch (filter) {
        case AuctionVerificationFilterEnum.All:
          return t('common.all')
        case AuctionVerificationFilterEnum.Verified:
          return t('toucan.filter.verified')
        case AuctionVerificationFilterEnum.Unverified:
          return t('toucan.filter.unverified')
      }
      throw new Error(`Unknown filter: ${filter}`)
    },
    [t],
  )

  const filterOptions = useMemo(() => {
    return Object.values(AuctionVerificationFilterEnum).map((option) => {
      const isVerified = option === AuctionVerificationFilterEnum.Verified
      const menuItem = (
        <InternalMenuItem key={`AuctionVerificationFilter-${option}`} onPress={() => onFilterChange(option)}>
          {getFilterLabel(option)}
          {selectedFilter === option && <Check size="$icon.16" color="$accent1" />}
        </InternalMenuItem>
      )

      // Add tooltip only for Verified option
      if (isVerified) {
        return (
          <Tooltip key={`AuctionVerificationFilter-${option}`} placement="right">
            <Tooltip.Trigger>{menuItem}</Tooltip.Trigger>
            <Tooltip.Content zIndex={zIndexes.overlay}>
              <Tooltip.Arrow />
              <Text variant="body4">{t('toucan.filter.verifiedLaunch.tooltip')}</Text>
            </Tooltip.Content>
          </Tooltip>
        )
      }

      return menuItem
    })
  }, [selectedFilter, onFilterChange, getFilterLabel, t])

  return (
    <Flex>
      <Trace modal={ModalName.ExploreVerificationFilter}>
        <Dropdown
          isOpen={open}
          toggleOpen={() => setOpen((prev) => !prev)}
          menuLabel={
            <Text variant="buttonLabel3" width="max-content">
              {selectedFilter === AuctionVerificationFilterEnum.All
                ? t('toucan.filter.verification')
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
