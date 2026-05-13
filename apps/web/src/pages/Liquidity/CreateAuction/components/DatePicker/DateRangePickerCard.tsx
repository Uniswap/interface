import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { CalendarModalTimeRow } from '~/pages/Liquidity/CreateAuction/components/DatePicker/CalendarModalTimeRow'
import { CreateAuctionDayPicker } from '~/pages/Liquidity/CreateAuction/components/DatePicker/CreateAuctionDayPicker'
import { SegmentedLocalDate } from '~/pages/Liquidity/CreateAuction/components/DatePicker/DatePickerCard'
import {
  combineDateAndTime,
  getLocaleDateFieldOrder,
} from '~/pages/Liquidity/CreateAuction/components/DatePicker/datePickerCardShared'

export type DateRangePickerCardProps = {
  startLabel: string
  endLabel: string
  startDate: Date | undefined
  endDate: Date | undefined
  /** Minimum allowed start date (e.g. now+5min). End date's effective min is `max(minStartDate, startDate)`. */
  minStartDate?: Date
  startPlaceholder: string
  endPlaceholder: string
  ariaLabelStart: string
  ariaLabelEnd: string
  onChange: (next: { startDate: Date | undefined; endDate: Date | undefined }) => void
}

type ActiveMode = 'start' | 'end'

function DateInputCard({
  label,
  date,
  placeholder,
  ariaLabel,
  active,
  onPress,
  fieldOrder,
}: {
  label: string
  date: Date | undefined
  placeholder: string
  ariaLabel: string
  active: boolean
  onPress: () => void
  fieldOrder: ReturnType<typeof getLocaleDateFieldOrder>
}) {
  return (
    <TouchableArea
      flex={1}
      flexBasis={0}
      backgroundColor="$surface2"
      borderRadius="$rounded16"
      borderWidth={2}
      borderColor={active ? '$accent1' : '$transparent'}
      p="$spacing16"
      gap="$spacing4"
      cursor="pointer"
      aria-label={ariaLabel}
      onPress={onPress}
    >
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      <Flex row alignItems="center" minHeight={24} width="100%">
        {date ? (
          <SegmentedLocalDate date={date} fieldOrder={fieldOrder} />
        ) : (
          <Text flex={1} variant="subheading1" color="$neutral3">
            {placeholder}
          </Text>
        )}
      </Flex>
    </TouchableArea>
  )
}

export function DateRangePickerCard({
  startLabel,
  endLabel,
  startDate,
  endDate,
  minStartDate,
  startPlaceholder,
  endPlaceholder,
  ariaLabelStart,
  ariaLabelEnd,
  onChange,
}: DateRangePickerCardProps) {
  const { locale } = useCurrentLanguageInfo()
  const fieldOrder = useMemo(() => getLocaleDateFieldOrder(locale), [locale])

  const [calendarOpen, setCalendarOpen] = useState(false)
  const [activeMode, setActiveMode] = useState<ActiveMode>('start')

  // Pending hour/minute used when the active date isn't set yet — so editing the time-row before
  // picking a day still has somewhere to land.
  const [pendingStartHour24, setPendingStartHour24] = useState(0)
  const [pendingStartMinute, setPendingStartMinute] = useState(0)
  const [pendingEndHour24, setPendingEndHour24] = useState(0)
  const [pendingEndMinute, setPendingEndMinute] = useState(0)

  const activeDate = activeMode === 'start' ? startDate : endDate
  const activeHour24 = activeDate
    ? activeDate.getHours()
    : activeMode === 'start'
      ? pendingStartHour24
      : pendingEndHour24
  const activeMinute = activeDate
    ? activeDate.getMinutes()
    : activeMode === 'start'
      ? pendingStartMinute
      : pendingEndMinute

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

  const handleRangeChange = useCallback(
    (next: { rangeStart?: Date; rangeEnd?: Date }) => {
      // Apply the active mode's stored time to the newly-clicked day so the time-row's prior edits stick.
      const applyTimeFor = (mode: ActiveMode, day: Date | undefined): Date | undefined => {
        if (!day) {
          return undefined
        }
        const h = mode === 'start' ? pendingStartHour24 : pendingEndHour24
        const m = mode === 'start' ? pendingStartMinute : pendingEndMinute
        const sourced = mode === 'start' ? startDate : endDate
        const hour24 = sourced ? sourced.getHours() : h
        const minute = sourced ? sourced.getMinutes() : m
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

  const handleTimeChange = useCallback(
    (hour24: number, minute: number) => {
      if (activeMode === 'start') {
        if (startDate) {
          onChange({
            startDate: clampAboveFloor(combineDateAndTime({ day: startDate, hour24, minute }), minStartDate),
            endDate,
          })
        } else {
          setPendingStartHour24(hour24)
          setPendingStartMinute(minute)
        }
      } else {
        if (endDate) {
          onChange({
            startDate,
            endDate: clampAboveFloor(combineDateAndTime({ day: endDate, hour24, minute }), effectiveMinEndDate),
          })
        } else {
          setPendingEndHour24(hour24)
          setPendingEndMinute(minute)
        }
      }
    },
    [activeMode, startDate, endDate, onChange, clampAboveFloor, minStartDate, effectiveMinEndDate],
  )

  // Container ref captures both the input row and the popover so click-outside can dismiss.
  const containerRef = useRef<HTMLDivElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!calendarOpen) {
      return undefined
    }
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (target && containerRef.current && !containerRef.current.contains(target)) {
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
    <Flex ref={containerRef} position="relative" width="100%">
      <Flex row gap="$spacing12" width="100%">
        <DateInputCard
          label={startLabel}
          date={startDate}
          placeholder={startPlaceholder}
          ariaLabel={ariaLabelStart}
          active={calendarOpen && activeMode === 'start'}
          fieldOrder={fieldOrder}
          onPress={handleOpenForStart}
        />
        <DateInputCard
          label={endLabel}
          date={endDate}
          placeholder={endPlaceholder}
          ariaLabel={ariaLabelEnd}
          active={calendarOpen && activeMode === 'end'}
          fieldOrder={fieldOrder}
          onPress={handleOpenForEnd}
        />
      </Flex>
      {calendarOpen ? (
        <Flex
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt="$spacing24"
          alignItems="center"
          zIndex={zIndexes.dropdown}
        >
          <Flex
            ref={popoverRef}
            backgroundColor="$surface1"
            borderRadius="$rounded24"
            borderWidth={1}
            borderColor="$surface3"
            p="$spacing32"
            gap="$spacing16"
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
              onActiveModeChange={setActiveMode}
              onRangeChange={handleRangeChange}
            />
            <CalendarModalTimeRow hour24={activeHour24} minute={activeMinute} onChange={handleTimeChange} />
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
}
