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
import type { TFunction } from 'i18next'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import {
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'
import { AuctionStatus } from '~/types/auctionFilters'

const STATUS_OPTIONS = [
  AuctionStatus.All,
  AuctionStatus.Active,
  AuctionStatus.Upcoming,
  AuctionStatus.Launched,
  AuctionStatus.Failed,
] as const

const DROPDOWN_OFFSET = 10

function getStatusLabel({ status, t }: { status: AuctionStatus; t: TFunction }): string {
  switch (status) {
    case AuctionStatus.Active:
      return t('toucan.filter.active')
    case AuctionStatus.Upcoming:
      return t('toucan.filter.upcoming')
    case AuctionStatus.Launched:
      return t('toucan.auction.timeRemaining.completed')
    case AuctionStatus.Failed:
      return t('common.failed')
    case AuctionStatus.All:
    default:
      return t('common.all')
  }
}

export function AuctionStatusFilter() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const selectedStatus = useExploreTablesFilterStore((s) => s.statusFilter)
  const { setStatusFilter } = useExploreTablesFilterStoreActions()
  const media = useMedia()
  const headerHeight = useAppHeaderHeight()
  const scrollbarStyles = useScrollbarStyles()
  const shadowProps = useShadowPropsMedium()

  const onStatusChange = useCallback(
    (status: AuctionStatus) => {
      setStatusFilter(status)
      sendAnalyticsEvent(UniswapEventName.AuctionFilterSelected, {
        filter: status,
      })
    },
    [setStatusFilter],
  )

  return (
    <Flex>
      <Trace modal={ModalName.ExploreStatusFilter}>
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
          <DropdownMenuTrigger render={<TriggerButtonCompat isExpanded={open} className="h-[40px] w-max pl-[14px]" />}>
            <Text variant="buttonLabel3" width="max-content">
              {selectedStatus === AuctionStatus.All
                ? t('toucan.filter.status')
                : getStatusLabel({ status: selectedStatus, t })}
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
            <DropdownMenuRadioGroup value={selectedStatus} onValueChange={onStatusChange}>
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuRadioItem
                  key={option}
                  unstyled
                  value={option}
                  closeOnClick
                  render={<InternalMenuItem className="outline-none data-highlighted:bg-surface3" />}
                >
                  {getStatusLabel({ status: option, t })}
                  {selectedStatus === option && <Check size="$icon.16" color="$accent1" />}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Trace>
    </Flex>
  )
}
