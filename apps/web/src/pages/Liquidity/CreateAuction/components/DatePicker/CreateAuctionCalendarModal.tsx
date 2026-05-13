import { Flex } from 'ui/src'
// oxlint-disable-next-line no-restricted-imports -- `Modal` from uniswap always passes `adaptToSheet={isWebApp}`; this flow must stay centered on all breakpoints (no bottom sheet).
import { AdaptiveWebModal } from 'ui/src/components/modal/AdaptiveWebModal'
import { CalendarModalTimeRow } from '~/pages/Liquidity/CreateAuction/components/DatePicker/CalendarModalTimeRow'
import { CreateAuctionDayPicker } from '~/pages/Liquidity/CreateAuction/components/DatePicker/CreateAuctionDayPicker'

type SingleVariant = {
  variant?: 'single'
  selected?: Date
  onSelect: (day: Date) => void
}

type RangeVariant = {
  variant: 'range'
  rangeStart?: Date
  rangeEnd?: Date
  activeMode: 'start' | 'end'
  onActiveModeChange: (mode: 'start' | 'end') => void
  onRangeChange: (next: { rangeStart?: Date; rangeEnd?: Date }) => void
}

export type CreateAuctionCalendarModalProps = (SingleVariant | RangeVariant) & {
  open: boolean
  onOpenChange: (open: boolean) => void
  minDate?: Date
  pickerMode: 'date' | 'datetime-local'
  /** When true, render a time row (hour/minute/AM-PM and UTC offset) below the calendar. */
  showTimeRow?: boolean
  /** Required when `showTimeRow` is true. In range mode, owner maps activeMode → which date's hour/minute to feed in. */
  hour24?: number
  minute?: number
  onTimeChange?: (hour24: number, minute: number) => void
}

/**
 * Full-screen centered calendar (Tamagui dialog). Uses `AdaptiveWebModal` with `adaptToSheet={false}` so it does not become a sheet on small viewports.
 */
export function CreateAuctionCalendarModal(props: CreateAuctionCalendarModalProps) {
  const { open, onOpenChange, minDate, pickerMode, showTimeRow = false, hour24, minute, onTimeChange } = props

  return (
    <AdaptiveWebModal
      adaptToSheet={false}
      alignment="center"
      backgroundColor="$surface1"
      borderRadius="$rounded24"
      borderWidth={0}
      gap="$none"
      isOpen={open}
      maxWidth={512}
      p="$spacing32"
      /* Default dialog uses overflow:auto + thin scrollbars (gutter); calendar fits without scroll. */
      width="max-content"
      $platform-web={{ overflow: 'hidden' }}
      onClose={() => onOpenChange(false)}
    >
      <Flex gap="$spacing16" width="100%">
        {props.variant === 'range' ? (
          <CreateAuctionDayPicker
            variant="range"
            calendarOpen={open}
            minDate={minDate}
            pickerMode={pickerMode}
            rangeStart={props.rangeStart}
            rangeEnd={props.rangeEnd}
            activeMode={props.activeMode}
            onActiveModeChange={props.onActiveModeChange}
            onRangeChange={props.onRangeChange}
          />
        ) : (
          <CreateAuctionDayPicker
            calendarOpen={open}
            minDate={minDate}
            pickerMode={pickerMode}
            selected={props.selected}
            onSelect={props.onSelect}
          />
        )}
        {showTimeRow && onTimeChange ? (
          <CalendarModalTimeRow hour24={hour24 ?? 0} minute={minute ?? 0} onChange={onTimeChange} />
        ) : null}
      </Flex>
    </AdaptiveWebModal>
  )
}
