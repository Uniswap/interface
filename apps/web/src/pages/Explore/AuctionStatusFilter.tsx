import { Flex, Text, zIndexes } from '@universe/mycelium'
import { Check } from '@universe/mycelium/icons/Check'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@universe/mycelium/shadcn'
import { useMedia, useScrollbarStyles, useShadowPropsMedium } from '@universe/mycelium/theme-hooks-compat'
import { TriggerButtonCompat } from '@universe/mycelium/trigger-button-compat'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import {
  AuctionQuickFilter,
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'

/** Status options exposed by the dropdown; shares the AuctionQuickFilter dimension with the pills. */
const STATUS_OPTIONS = [AuctionQuickFilter.All, AuctionQuickFilter.Active, AuctionQuickFilter.Completed] as const

const DROPDOWN_OFFSET = 10

export function AuctionStatusFilter() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const selectedFilter = useExploreTablesFilterStore((s) => s.quickFilter)
  const { setQuickFilter: setSelectedFilter } = useExploreTablesFilterStoreActions()
  const media = useMedia()
  const headerHeight = useAppHeaderHeight()
  const scrollbarStyles = useScrollbarStyles()
  const shadowProps = useShadowPropsMedium()

  const onFilterChange = useCallback(
    (filter: AuctionQuickFilter) => {
      setSelectedFilter(filter)
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

  // Pill-only selections (Verified / New) aren't statuses, so the trigger keeps its generic label for them.
  const isStatusSelection =
    selectedFilter === AuctionQuickFilter.Active || selectedFilter === AuctionQuickFilter.Completed

  return (
    <Flex>
      <Trace modal={ModalName.ExploreStatusFilter}>
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
          <DropdownMenuTrigger
            nativeButton={false}
            render={<TriggerButtonCompat isExpanded={open} className="h-[40px] w-max pl-[14px]" />}
          >
            <Text variant="buttonLabel3" width="max-content">
              {isStatusSelection ? getFilterLabel(selectedFilter) : t('toucan.filter.status')}
            </Text>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            unstyled
            sideOffset={DROPDOWN_OFFSET}
            align={media.lg ? 'start' : 'end'}
            positionerProps={{
              // Exclude the sticky header while preserving Base UI's other viewport padding defaults.
              collisionPadding: { top: headerHeight, right: 5, bottom: 5, left: 5 },
              style: { zIndex: zIndexes.dropdown },
            }}
            render={
              <Flex
                {...shadowProps}
                style={scrollbarStyles}
                className="outline-none transition-opacity duration-150 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0"
                flexDirection="column"
                backgroundColor="$surface1"
                borderWidth={0.5}
                borderStyle="solid"
                borderColor="$surface3"
                borderRadius="$rounded12"
                p="$spacing8"
                overflow="auto"
                maxHeight="min(300px, var(--available-height))"
                width={160}
              />
            }
          >
            {/* Radio semantics (menuitemradio + aria-checked) so the selected status is announced, not just drawn. */}
            <DropdownMenuRadioGroup value={selectedFilter} onValueChange={onFilterChange}>
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuRadioItem
                  key={option}
                  unstyled
                  value={option}
                  closeOnClick
                  render={<InternalMenuItem className="outline-none data-highlighted:bg-surface3" />}
                >
                  {getFilterLabel(option)}
                  {selectedFilter === option && <Check size="$icon.16" color="$accent1" />}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Trace>
    </Flex>
  )
}
