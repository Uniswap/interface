import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { CalendarModalTimeRow } from '~/pages/Liquidity/CreateAuction/components/DatePicker/CalendarModalTimeRow'
import { CreateAuctionDayPicker } from '~/pages/Liquidity/CreateAuction/components/DatePicker/CreateAuctionDayPicker'
import { SegmentedLocalDate } from '~/pages/Liquidity/CreateAuction/components/DatePicker/DatePickerCard'
import {
  combineDateAndTime,
  formatTimeForDisplay,
  formatUtcOffset,
  getLocaleDateFieldOrder,
} from '~/pages/Liquidity/CreateAuction/components/DatePicker/datePickerCardShared'
import type { TokenAccentHex } from '~/pages/Liquidity/CreateAuction/tokenAccentHex'

export type DateRangePickerCardProps = {
  startLabel: string
  endLabel: string
  /** Captions shown above each time row in the popover (e.g. "Start time" / "End time"). */
  startTimeLabel: string
  endTimeLabel: string
  startDate: Date | undefined
  endDate: Date | undefined
  /** Minimum allowed start date (e.g. now+5m). End date's effective min is `max(minStartDate, startDate)`. */
  minStartDate?: Date
  startPlaceholder: string
  endPlaceholder: string
  ariaLabelStart: string
  ariaLabelEnd: string
  /** Hex color extracted from the token image. Drives the active input border + calendar accent fills. */
  tokenColor?: TokenAccentHex
  onChange: (next: { startDate: Date | undefined; endDate: Date | undefined }) => void
}

type ActiveMode = 'start' | 'end'

export type DateRangePickerCardHandle = {
  openCalendar: (mode: ActiveMode) => void
}

function DateInputCard({
  label,
  date,
  placeholder,
  ariaLabel,
  active,
  onPress,
  fieldOrder,
  locale,
  position,
  activeBorderColor,
}: {
  label: string
  date: Date | undefined
  placeholder: string
  ariaLabel: string
  active: boolean
  onPress: () => void
  fieldOrder: ReturnType<typeof getLocaleDateFieldOrder>
  locale: string
  /** Determines which corners get the larger 16px radius vs the 4px "shared edge" radius. */
  position: 'start' | 'end'
  activeBorderColor: string
}) {
  const outerRadius = 16
  const innerRadius = 4
  const cornerRadii = {
    borderTopLeftRadius: position === 'start' ? outerRadius : innerRadius,
    borderBottomLeftRadius: position === 'start' ? outerRadius : innerRadius,
    borderTopRightRadius: position === 'end' ? outerRadius : innerRadius,
    borderBottomRightRadius: position === 'end' ? outerRadius : innerRadius,
  }
  return (
    <Trace logPress element={position === 'start' ? ElementName.AuctionStartDatetime : ElementName.AuctionEndDatetime}>
      <TouchableArea
        flex={1}
        flexBasis={0}
        backgroundColor="$surface2"
        borderWidth={2}
        borderColor={active ? activeBorderColor : '$transparent'}
        p="$spacing16"
        gap="$spacing4"
        cursor="pointer"
        userSelect="none"
        aria-label={ariaLabel}
        onPress={onPress}
        {...cornerRadii}
      >
        <Text variant="body3" color="$neutral2">
          {label}
        </Text>
        <Flex row flexWrap="wrap" alignItems="center" minHeight={24} width="100%" gap="$spacing8">
          {date ? (
            <>
              <Flex flexGrow={1} flexShrink={1} minWidth={0}>
                <SegmentedLocalDate date={date} fieldOrder={fieldOrder} />
              </Flex>
              <Text variant="subheading1" color="$neutral2" flexShrink={0} ml="auto" textAlign="right">
                {formatTimeForDisplay({ date, locale })}
              </Text>
            </>
          ) : (
            <Text flex={1} variant="subheading1" color="$neutral3">
              {placeholder}
            </Text>
          )}
        </Flex>
      </TouchableArea>
    </Trace>
  )
}

export const DateRangePickerCard = forwardRef<DateRangePickerCardHandle, DateRangePickerCardProps>(
  function DateRangePickerCard(
    {
      startLabel,
      endLabel,
      startTimeLabel,
      endTimeLabel,
      startDate,
      endDate,
      minStartDate,
      startPlaceholder,
      endPlaceholder,
      ariaLabelStart,
      ariaLabelEnd,
      tokenColor,
      onChange,
    },
    ref,
  ) {
    // Active input border uses the validated token accent when available, else the default accent token.
    const activeBorderColor = tokenColor ?? '$accent1'
    const { t } = useTranslation()
    const { locale } = useCurrentLanguageInfo()
    const fieldOrder = useMemo(() => getLocaleDateFieldOrder(locale), [locale])
    const utcOffset = useMemo(() => formatUtcOffset(), [])

    const [calendarOpen, setCalendarOpen] = useState(false)
    const [activeMode, setActiveMode] = useState<ActiveMode>('start')

    // Pending hour/minute used when the corresponding date isn't set yet — so editing the time row
    // before picking a day still has somewhere to land.
    const [pendingStartHour24, setPendingStartHour24] = useState(10)
    const [pendingStartMinute, setPendingStartMinute] = useState(0)
    const [pendingEndHour24, setPendingEndHour24] = useState(10)
    const [pendingEndMinute, setPendingEndMinute] = useState(0)

    const startHour24 = startDate ? startDate.getHours() : pendingStartHour24
    const startMinute = startDate ? startDate.getMinutes() : pendingStartMinute
    const endHour24 = endDate ? endDate.getHours() : pendingEndHour24
    const endMinute = endDate ? endDate.getMinutes() : pendingEndMinute

    /** Same as OverlayDateWithModalTimePickerCard: calendar can allow "today" while min is later same day. */
    const clampAboveFloor = useCallback((selected: Date, floor: Date | undefined): Date => {
      if (floor && selected.getTime() <= floor.getTime()) {
        return new Date(floor.getTime() + 60_000)
      }
      return selected
    }, [])

    const effectiveMinEndDate = useMemo(() => {
      if (!minStartDate && !startDate) {
        return undefined
      }
      if (!minStartDate) {
        return startDate
      }
      if (!startDate) {
        return minStartDate
      }
      return startDate.getTime() >= minStartDate.getTime() ? startDate : minStartDate
    }, [minStartDate, startDate])

    const handleOpenForStart = useCallback(() => {
      setActiveMode('start')
      setCalendarOpen(true)
    }, [])

    const handleOpenForEnd = useCallback(() => {
      // Defensive: must pick start before end.
      setActiveMode(startDate ? 'end' : 'start')
      setCalendarOpen(true)
    }, [startDate])

    useImperativeHandle(
      ref,
      () => ({
        openCalendar: (mode) => {
          if (mode === 'start') {
            handleOpenForStart()
          } else {
            handleOpenForEnd()
          }
        },
      }),
      [handleOpenForStart, handleOpenForEnd],
    )

    const handleRangeChange = useCallback(
      (next: { rangeStart?: Date; rangeEnd?: Date }) => {
        // Apply the per-side stored time to the newly-clicked day so the time-row edits stick.
        const applyTimeFor = (mode: ActiveMode, day: Date | undefined): Date | undefined => {
          if (!day) {
            return undefined
          }
          const sourced = mode === 'start' ? startDate : endDate
          const fallbackHour = mode === 'start' ? pendingStartHour24 : pendingEndHour24
          const fallbackMinute = mode === 'start' ? pendingStartMinute : pendingEndMinute
          const hour24 = sourced ? sourced.getHours() : fallbackHour
          const minute = sourced ? sourced.getMinutes() : fallbackMinute
          const combined = combineDateAndTime({ day, hour24, minute })
          return mode === 'start'
            ? clampAboveFloor(combined, minStartDate)
            : clampAboveFloor(combined, effectiveMinEndDate)
        }
        onChange({
          startDate: next.rangeStart ? applyTimeFor('start', next.rangeStart) : undefined,
          endDate: next.rangeEnd ? applyTimeFor('end', next.rangeEnd) : undefined,
        })
      },
      [
        onChange,
        pendingStartHour24,
        pendingStartMinute,
        pendingEndHour24,
        pendingEndMinute,
        startDate,
        endDate,
        clampAboveFloor,
        minStartDate,
        effectiveMinEndDate,
      ],
    )

    const handleStartTimeChange = useCallback(
      (hour24: number, minute: number) => {
        if (startDate) {
          onChange({
            startDate: clampAboveFloor(combineDateAndTime({ day: startDate, hour24, minute }), minStartDate),
            endDate,
          })
        } else {
          setPendingStartHour24(hour24)
          setPendingStartMinute(minute)
        }
      },
      [startDate, endDate, onChange, clampAboveFloor, minStartDate],
    )

    const handleEndTimeChange = useCallback(
      (hour24: number, minute: number) => {
        if (endDate) {
          onChange({
            startDate,
            endDate: clampAboveFloor(combineDateAndTime({ day: endDate, hour24, minute }), effectiveMinEndDate),
          })
        } else {
          setPendingEndHour24(hour24)
          setPendingEndMinute(minute)
        }
      },
      [startDate, endDate, onChange, clampAboveFloor, effectiveMinEndDate],
    )

    // Click-outside dismissal compares against the input row and the popover content directly.
    // The absolute popover wrapper is full-width (left:0/right:0) and wider than the popover
    // itself (max-content), so checking against an outer container would treat clicks on the
    // empty horizontal padding to the sides of the popover as "inside" and fail to dismiss.
    const inputRowRef = useRef<HTMLDivElement | null>(null)
    const popoverRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
      if (!calendarOpen) {
        return undefined
      }
      const handlePointerDown = (event: MouseEvent) => {
        const target = event.target as Node | null
        if (!target) {
          return
        }
        const insideInputRow = inputRowRef.current?.contains(target) ?? false
        const insidePopover = popoverRef.current?.contains(target) ?? false
        if (!insideInputRow && !insidePopover) {
          setCalendarOpen(false)
        }
      }
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setCalendarOpen(false)
        }
      }
      document.addEventListener('mousedown', handlePointerDown)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handlePointerDown)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }, [calendarOpen])

    // When the popover opens, ensure its bottom is visible — scroll the page if needed so the user
    // doesn't have to manually scroll to see the calendar.
    useEffect(() => {
      if (!calendarOpen) {
        return
      }
      const node = popoverRef.current
      if (!node) {
        return
      }
      requestAnimationFrame(() => {
        node.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }, [calendarOpen])

    return (
      <Flex position="relative" width="100%">
        <Flex ref={inputRowRef} row gap="$spacing4" width="100%">
          <DateInputCard
            label={startLabel}
            date={startDate}
            placeholder={startPlaceholder}
            ariaLabel={ariaLabelStart}
            active={calendarOpen && activeMode === 'start'}
            fieldOrder={fieldOrder}
            locale={locale}
            position="start"
            activeBorderColor={activeBorderColor}
            onPress={handleOpenForStart}
          />
          <DateInputCard
            label={endLabel}
            date={endDate}
            placeholder={endPlaceholder}
            ariaLabel={ariaLabelEnd}
            active={calendarOpen && activeMode === 'end'}
            fieldOrder={fieldOrder}
            locale={locale}
            position="end"
            activeBorderColor={activeBorderColor}
            onPress={handleOpenForEnd}
          />
        </Flex>
        {calendarOpen ? (
          <Flex
            position="absolute"
            top="100%"
            left={0}
            right={0}
            mt="$spacing12"
            alignItems="center"
            zIndex={zIndexes.dropdown}
          >
            <Flex
              ref={popoverRef}
              backgroundColor="$surface1"
              borderRadius="$rounded24"
              p="$spacing20"
              gap="$spacing12"
              width="max-content"
              maxWidth={512}
              shadowColor="$shadowColor"
              shadowRadius={40}
              shadowOpacity={0.25}
              shadowOffset={{ width: 0, height: 16 }}
              $platform-web={{ overflow: 'hidden' }}
            >
              <CreateAuctionDayPicker
                variant="range"
                minDate={activeMode === 'end' ? effectiveMinEndDate : minStartDate}
                pickerMode="datetime-local"
                rangeStart={startDate}
                rangeEnd={endDate}
                activeMode={activeMode}
                tokenColor={tokenColor}
                onActiveModeChange={setActiveMode}
                onRangeChange={handleRangeChange}
              />
              <Flex
                row
                alignItems="flex-end"
                justifyContent="space-between"
                borderTopWidth={1}
                borderTopColor="$surface3"
                pt="$spacing16"
                width="100%"
                gap="$spacing12"
              >
                <CalendarModalTimeRow
                  label={startTimeLabel}
                  hour24={startHour24}
                  minute={startMinute}
                  onChange={handleStartTimeChange}
                />
                <CalendarModalTimeRow
                  label={endTimeLabel}
                  hour24={endHour24}
                  minute={endMinute}
                  onChange={handleEndTimeChange}
                  labelTrailing={
                    <Text
                      variant="body4"
                      color="$neutral3"
                      aria-label={t('toucan.createAuction.calendar.time.timezone')}
                    >
                      {utcOffset}
                    </Text>
                  }
                />
              </Flex>
            </Flex>
          </Flex>
        ) : null}
      </Flex>
    )
  },
)
