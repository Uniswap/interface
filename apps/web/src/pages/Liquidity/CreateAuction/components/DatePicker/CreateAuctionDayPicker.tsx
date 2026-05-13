import 'react-day-picker/dist/style.css'
import '~/pages/Liquidity/CreateAuction/components/DatePicker/createAuctionDayPicker.css'
import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import type { Matcher } from 'react-day-picker'
import { Flex } from 'ui/src'
import { ChevronLeft } from 'ui/src/components/icons/ChevronLeft'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function buildDisabledMatcher({
  minDate,
  pickerMode,
}: {
  minDate: Date | undefined
  pickerMode: 'date' | 'datetime-local'
}): Matcher | undefined {
  if (!minDate) {
    return undefined
  }
  if (pickerMode === 'date') {
    const minDay = startOfLocalDay(minDate)
    return (day: Date) => startOfLocalDay(day).getTime() < minDay.getTime()
  }
  return (day: Date) => {
    const endOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999)
    return endOfDay.getTime() <= minDate.getTime()
  }
}

function displayAnchorMonth(selected: Date | undefined, fallback: Date | undefined): Date {
  return selected ?? fallback ?? new Date()
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isStrictlyBetween({ day, lo, hi }: { day: Date; lo: Date; hi: Date }): boolean {
  const t = startOfLocalDay(day).getTime()
  const loT = startOfLocalDay(lo).getTime()
  const hiT = startOfLocalDay(hi).getTime()
  return t > loT && t < hiT
}

/** Returns true when `day` belongs to a different month/year than `displayedMonth`. */
function isOutsideDisplayedMonth(day: Date, displayedMonth: Date): boolean {
  return day.getFullYear() !== displayedMonth.getFullYear() || day.getMonth() !== displayedMonth.getMonth()
}

type SingleVariantProps = {
  variant?: 'single'
  selected?: Date
  onSelect: (day: Date) => void
}

type RangeVariantProps = {
  variant: 'range'
  rangeStart?: Date
  rangeEnd?: Date
  /** Which date the next click commits. Picker calls `onActiveModeChange` after each commit per the auto-toggle rules. */
  activeMode: 'start' | 'end'
  onActiveModeChange: (mode: 'start' | 'end') => void
  onRangeChange: (next: { rangeStart?: Date; rangeEnd?: Date }) => void
}

export type CreateAuctionDayPickerProps = (SingleVariantProps | RangeVariantProps) & {
  minDate?: Date
  pickerMode: 'date' | 'datetime-local'
  /**
   * When provided, the visible month resets whenever this transitions to `true`
   * (e.g. Tamagui dialog keeps children mounted while closed). Omit when the picker
   * only mounts while open (unmounting already resets internal month state).
   */
  calendarOpen?: boolean
}

/**
 * Single-month calendar for Create Auction (Sunday week, Spore-themed text, 64×64 day cells).
 *
 * Two variants:
 * - `single` (default) — picks a single day; existing Timelock + start-only flows.
 * - `range` — picks a `{ rangeStart, rangeEnd }` pair. Commits with auto-toggle: after start
 *   commits, `activeMode` flips to `'end'`; after end commits, back to `'start'`.
 */
export function CreateAuctionDayPicker(props: CreateAuctionDayPickerProps) {
  if (props.variant === 'range') {
    return <RangeDayPicker {...props} />
  }
  return (
    <SingleDayPicker
      {...(props as SingleVariantProps & {
        minDate?: Date
        pickerMode: 'date' | 'datetime-local'
        calendarOpen?: boolean
      })}
    />
  )
}

function useShellStyle(): CSSProperties {
  const colors = useSporeColors()
  return useMemo(
    () =>
      ({
        '--auction-calendar-accent-color': colors.accent1.val,
        '--auction-calendar-default-hover-bg': colors.surface3.val,
        '--auction-calendar-text-primary': colors.neutral1.val,
        '--auction-calendar-text-secondary': colors.neutral2.val,
        '--auction-calendar-text-tertiary': colors.neutral3.val,
        '--auction-calendar-accent-strong': colors.accent1.val,
        '--auction-calendar-accent-strong-hovered': colors.accent1Hovered.val,
        '--auction-calendar-accent-soft': colors.accent2.val,
        '--auction-calendar-surface1': colors.surface1.val,
        '--auction-calendar-surface2': colors.surface2.val,
      }) as CSSProperties,
    [
      colors.accent1.val,
      colors.accent1Hovered.val,
      colors.accent2.val,
      colors.neutral1.val,
      colors.neutral2.val,
      colors.neutral3.val,
      colors.surface1.val,
      colors.surface2.val,
      colors.surface3.val,
    ],
  )
}

function SingleDayPicker({
  selected,
  minDate,
  pickerMode,
  onSelect,
  calendarOpen,
}: SingleVariantProps & { minDate?: Date; pickerMode: 'date' | 'datetime-local'; calendarOpen?: boolean }) {
  const disabled = useMemo(() => buildDisabledMatcher({ minDate, pickerMode }), [minDate, pickerMode])
  const [month, setMonth] = useState<Date>(() => displayAnchorMonth(selected, minDate))
  const prevCalendarOpenRef = useRef(calendarOpen)

  useEffect(() => {
    if (calendarOpen === undefined) {
      return
    }
    const wasClosed = prevCalendarOpenRef.current === false
    prevCalendarOpenRef.current = calendarOpen
    if (calendarOpen && wasClosed) {
      setMonth(displayAnchorMonth(selected, minDate))
    }
  }, [calendarOpen, selected, minDate])

  const shellStyle = useShellStyle()

  return (
    <Flex className="auction-day-picker-shell" style={shellStyle}>
      <DayPicker
        mode="single"
        weekStartsOn={0}
        showOutsideDays
        fixedWeeks
        selected={selected}
        onSelect={(d) => {
          if (!d) {
            return
          }
          if (isOutsideDisplayedMonth(d, month)) {
            setMonth(startOfLocalDay(new Date(d.getFullYear(), d.getMonth(), 1)))
          }
          onSelect(d)
        }}
        disabled={disabled}
        month={month}
        onMonthChange={setMonth}
        components={{
          IconLeft: () => <ChevronLeft size="$icon.16" color="$neutral2" />,
          IconRight: () => <RotatableChevron direction="end" size="$icon.16" color="$neutral2" />,
        }}
      />
    </Flex>
  )
}

function RangeDayPicker({
  rangeStart,
  rangeEnd,
  activeMode,
  onActiveModeChange,
  onRangeChange,
  minDate,
  pickerMode,
  calendarOpen,
}: RangeVariantProps & { minDate?: Date; pickerMode: 'date' | 'datetime-local'; calendarOpen?: boolean }) {
  const [hoveredDate, setHoveredDate] = useState<Date | undefined>(undefined)

  const anchorDate = activeMode === 'end' ? rangeEnd : rangeStart
  const [month, setMonth] = useState<Date>(() => displayAnchorMonth(anchorDate, minDate))
  const prevCalendarOpenRef = useRef(calendarOpen)

  useEffect(() => {
    if (calendarOpen === undefined) {
      return
    }
    const wasClosed = prevCalendarOpenRef.current === false
    prevCalendarOpenRef.current = calendarOpen
    if (calendarOpen && wasClosed) {
      setMonth(displayAnchorMonth(anchorDate, minDate))
    }
  }, [calendarOpen, anchorDate, minDate])

  // In 'end' mode, lower bound is max(minDate, rangeStart).
  const effectiveMinDate = useMemo(() => {
    if (activeMode === 'end' && rangeStart) {
      const baseMin = minDate?.getTime() ?? 0
      return new Date(Math.max(baseMin, startOfLocalDay(rangeStart).getTime()))
    }
    return minDate
  }, [activeMode, minDate, rangeStart])

  const disabled = useMemo(
    () => buildDisabledMatcher({ minDate: effectiveMinDate, pickerMode }),
    [effectiveMinDate, pickerMode],
  )

  // Effective end-day for visualization: committed end if set, else hovered day during 'end' mode.
  const effectiveEnd = useMemo(() => {
    if (rangeEnd) {
      return rangeEnd
    }
    if (activeMode === 'end' && hoveredDate && rangeStart && hoveredDate.getTime() >= rangeStart.getTime()) {
      return hoveredDate
    }
    return undefined
  }, [rangeEnd, activeMode, hoveredDate, rangeStart])

  const modifiers = useMemo(() => {
    const m: Record<string, Matcher | Matcher[]> = {}
    if (rangeStart) {
      m.rangeStart = rangeStart
    }
    if (effectiveEnd) {
      m.rangeEnd = effectiveEnd
    }
    if (rangeStart && effectiveEnd && !isSameDay(rangeStart, effectiveEnd)) {
      const lo = rangeStart
      const hi = effectiveEnd
      m.rangeMiddle = (day: Date) => isStrictlyBetween({ day, lo, hi })
    }
    if (activeMode === 'start' && hoveredDate && (!rangeStart || !isSameDay(hoveredDate, rangeStart))) {
      m.hoverPreview = hoveredDate
    }
    return m
  }, [rangeStart, effectiveEnd, activeMode, hoveredDate])

  const handleDayClick = useCallback(
    (clicked: Date) => {
      const day = startOfLocalDay(clicked)
      if (isOutsideDisplayedMonth(day, month)) {
        setMonth(new Date(day.getFullYear(), day.getMonth(), 1))
      }
      if (activeMode === 'start') {
        const keepEnd = rangeEnd && day.getTime() <= startOfLocalDay(rangeEnd).getTime()
        onRangeChange({ rangeStart: day, rangeEnd: keepEnd ? rangeEnd : undefined })
        onActiveModeChange('end')
        return
      }
      // end mode
      if (!rangeStart) {
        // defensive: no start yet; treat as picking start
        onRangeChange({ rangeStart: day, rangeEnd: undefined })
        onActiveModeChange('end')
        return
      }
      onRangeChange({ rangeStart, rangeEnd: day })
      onActiveModeChange('start')
    },
    [activeMode, rangeStart, rangeEnd, onRangeChange, onActiveModeChange, month],
  )

  const handleDayMouseLeave = useCallback(() => setHoveredDate(undefined), [])

  const shellStyle = useShellStyle()

  return (
    <Flex className="auction-day-picker-shell auction-day-picker-shell--range" style={shellStyle}>
      <DayPicker
        mode={undefined}
        weekStartsOn={0}
        showOutsideDays
        onDayClick={handleDayClick}
        onDayMouseEnter={setHoveredDate}
        onDayMouseLeave={handleDayMouseLeave}
        modifiers={modifiers}
        modifiersClassNames={{
          rangeStart: 'rdp-day_range-start',
          rangeMiddle: 'rdp-day_range-middle',
          rangeEnd: 'rdp-day_range-end',
          hoverPreview: 'rdp-day_hover-preview',
        }}
        disabled={disabled}
        month={month}
        onMonthChange={setMonth}
        components={{
          IconLeft: () => <ChevronLeft size="$icon.16" color="$neutral2" />,
          IconRight: () => <RotatableChevron direction="end" size="$icon.16" color="$neutral2" />,
        }}
      />
    </Flex>
  )
}
