import { Fragment, useCallback, useMemo, useState } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Calendar } from 'ui/src/components/icons/Calendar'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import {
  FORMAT_DATE_TIME_MEDIUM,
  useFormattedDateTime,
  useLocalizedDayjs,
} from 'uniswap/src/features/language/localizedDayjs'
import { CreateAuctionCalendarModal } from '~/pages/Liquidity/CreateAuction/components/DatePicker/CreateAuctionCalendarModal'
import { DatePickerCardSegmented } from '~/pages/Liquidity/CreateAuction/components/DatePicker/DatePickerCardSegmented'
import {
  type DateFieldKey,
  type DatePickerCardBaseProps,
  combineDateAndTime,
  getLocaleDateFieldOrder,
  pad,
} from '~/pages/Liquidity/CreateAuction/components/DatePicker/datePickerCardShared'

export function SegmentedLocalDate({
  date,
  fieldOrder,
}: {
  date: Date
  fieldOrder: readonly [DateFieldKey, DateFieldKey, DateFieldKey]
}) {
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const year = String(date.getFullYear())
  const valueFor: Record<DateFieldKey, string> = { month, day, year }
  return (
    <Flex row alignItems="center" flex={1} gap="$spacing4" minWidth={0}>
      {fieldOrder.map((key, index) => (
        <Fragment key={key}>
          {index > 0 ? (
            <Text variant="subheading1" color="$neutral3">
              /
            </Text>
          ) : null}
          <Text
            flex={index === fieldOrder.length - 1 ? 1 : undefined}
            minWidth={index === fieldOrder.length - 1 ? 0 : undefined}
            variant="subheading1"
            color="$neutral1"
          >
            {valueFor[key]}
          </Text>
        </Fragment>
      ))}
    </Flex>
  )
}

function OverlayDateOnlyPickerCard({
  label,
  date,
  minDate,
  placeholder,
  onDateChange,
  ariaLabel,
}: Omit<DatePickerCardBaseProps, 'type'>) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const { locale } = useCurrentLanguageInfo()
  const dateFieldOrder = useMemo(() => getLocaleDateFieldOrder(locale), [locale])

  const applyMinClamp = useCallback(
    (selected: Date): Date => {
      if (minDate && selected.getTime() <= minDate.getTime()) {
        return new Date(minDate.getTime() + 60000)
      }
      return selected
    },
    [minDate],
  )

  const handleSelectDay = useCallback(
    (localDay: Date) => {
      const next = new Date(localDay.getFullYear(), localDay.getMonth(), localDay.getDate())
      onDateChange(applyMinClamp(next))
      setCalendarOpen(false)
    },
    [applyMinClamp, onDateChange],
  )

  return (
    <Flex
      flex={1}
      flexBasis={0}
      position="relative"
      flexDirection="column"
      backgroundColor="$surface2"
      borderRadius="$rounded16"
      p="$spacing16"
      gap="$spacing8"
    >
      <Flex row alignItems="center" gap="$spacing6" width="100%">
        <Text flex={1} variant="body3" color="$neutral2">
          {label}
        </Text>
      </Flex>
      <TouchableArea
        aria-label={ariaLabel}
        row
        alignItems="center"
        flex={1}
        gap="$spacing4"
        width="100%"
        minHeight={28}
        cursor="pointer"
        onPress={() => setCalendarOpen(true)}
      >
        {date ? (
          <SegmentedLocalDate date={date} fieldOrder={dateFieldOrder} />
        ) : (
          <Text flex={1} variant="subheading1" color="$neutral3" pointerEvents="none">
            {placeholder}
          </Text>
        )}
        <Calendar size="$icon.24" color="$neutral2" pointerEvents="none" />
      </TouchableArea>
      <CreateAuctionCalendarModal
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        selected={date}
        minDate={minDate}
        pickerMode="date"
        onSelect={handleSelectDay}
      />
    </Flex>
  )
}

function OverlayDateTimeLocalPickerCard({
  label,
  date,
  minDate,
  placeholder,
  onDateChange,
  ariaLabel,
}: Omit<DatePickerCardBaseProps, 'type'>) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const dayjsInstance = useLocalizedDayjs()
  const formattedDateTime = useFormattedDateTime(dayjsInstance(date), FORMAT_DATE_TIME_MEDIUM)

  const applyMinClamp = useCallback(
    (selected: Date): Date => {
      if (minDate && selected.getTime() <= minDate.getTime()) {
        return new Date(minDate.getTime() + 60000)
      }
      return selected
    },
    [minDate],
  )

  const handleSelectDay = useCallback(
    (localDay: Date) => {
      const timeSource = date ?? new Date()
      const next = new Date(localDay.getFullYear(), localDay.getMonth(), localDay.getDate())
      next.setHours(timeSource.getHours(), timeSource.getMinutes(), 0, 0)
      onDateChange(applyMinClamp(next))
      setCalendarOpen(false)
    },
    [applyMinClamp, date, onDateChange],
  )

  return (
    <Flex
      flex={1}
      flexBasis={0}
      position="relative"
      flexDirection="column"
      backgroundColor="$surface2"
      borderRadius="$rounded16"
      p="$spacing16"
      gap="$spacing8"
    >
      <Flex row alignItems="center" gap="$spacing6" width="100%">
        <Text flex={1} variant="body3" color="$neutral2">
          {label}
        </Text>
      </Flex>
      <TouchableArea
        aria-label={ariaLabel}
        row
        alignItems="center"
        flex={1}
        gap="$spacing4"
        width="100%"
        minHeight={28}
        cursor="pointer"
        onPress={() => setCalendarOpen(true)}
      >
        <Text flex={1} variant="subheading1" color={date ? '$neutral1' : '$neutral3'} pointerEvents="none">
          {date ? formattedDateTime : placeholder}
        </Text>
        <Calendar size="$icon.24" color="$neutral2" pointerEvents="none" />
      </TouchableArea>
      <CreateAuctionCalendarModal
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        selected={date}
        minDate={minDate}
        pickerMode="datetime-local"
        onSelect={handleSelectDay}
      />
    </Flex>
  )
}

function OverlayDateWithModalTimePickerCard({
  label,
  date,
  minDate,
  placeholder,
  onDateChange,
  ariaLabel,
}: Omit<DatePickerCardBaseProps, 'type' | 'showTimeInModal'>) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const { locale } = useCurrentLanguageInfo()
  const dateFieldOrder = useMemo(() => getLocaleDateFieldOrder(locale), [locale])

  // Time the user has picked but hasn't yet committed via a calendar-day click.
  // Once `date` is set, the source of truth for hour/minute is `date` itself.
  const [pendingHour24, setPendingHour24] = useState(10)
  const [pendingMinute, setPendingMinute] = useState(0)

  const hour24 = date ? date.getHours() : pendingHour24
  const minute = date ? date.getMinutes() : pendingMinute

  const applyMinClamp = useCallback(
    (selected: Date): Date => {
      if (minDate && selected.getTime() <= minDate.getTime()) {
        return new Date(minDate.getTime() + 60000)
      }
      return selected
    },
    [minDate],
  )

  const handleSelectDay = useCallback(
    (localDay: Date) => {
      const next = combineDateAndTime({ day: localDay, hour24, minute })
      onDateChange(applyMinClamp(next))
      // Modal stays open so the user can adjust the time before closing.
    },
    [applyMinClamp, hour24, minute, onDateChange],
  )

  const handleTimeChange = useCallback(
    (nextHour24: number, nextMinute: number) => {
      if (date) {
        onDateChange(applyMinClamp(combineDateAndTime({ day: date, hour24: nextHour24, minute: nextMinute })))
      } else {
        setPendingHour24(nextHour24)
        setPendingMinute(nextMinute)
      }
    },
    [applyMinClamp, date, onDateChange],
  )

  return (
    <Flex
      flex={1}
      flexBasis={0}
      position="relative"
      flexDirection="column"
      backgroundColor="$surface2"
      borderRadius="$rounded16"
      p="$spacing16"
      gap="$spacing8"
    >
      <Flex row alignItems="center" gap="$spacing6" width="100%">
        <Text flex={1} variant="body3" color="$neutral2">
          {label}
        </Text>
      </Flex>
      <TouchableArea
        aria-label={ariaLabel}
        row
        alignItems="center"
        flex={1}
        gap="$spacing4"
        width="100%"
        minHeight={28}
        cursor="pointer"
        onPress={() => setCalendarOpen(true)}
      >
        {date ? (
          <SegmentedLocalDate date={date} fieldOrder={dateFieldOrder} />
        ) : (
          <Text flex={1} variant="subheading1" color="$neutral3" pointerEvents="none">
            {placeholder}
          </Text>
        )}
        <Calendar size="$icon.24" color="$neutral2" pointerEvents="none" />
      </TouchableArea>
      <CreateAuctionCalendarModal
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        selected={date}
        minDate={minDate}
        pickerMode="datetime-local"
        onSelect={handleSelectDay}
        showTimeRow
        hour24={hour24}
        minute={minute}
        onTimeChange={handleTimeChange}
      />
    </Flex>
  )
}

function OverlayDatePickerCard({ type = 'datetime-local', ...rest }: DatePickerCardBaseProps) {
  if (type === 'date') {
    return <OverlayDateOnlyPickerCard {...rest} />
  }
  return <OverlayDateTimeLocalPickerCard {...rest} />
}

export function DatePickerCard({
  segmentedDateInput = false,
  showTimeInModal = false,
  ...props
}: DatePickerCardBaseProps & {
  /**
   * When true (timelock custom unlock date), use editable numeric date fields (order follows locale)
   * and open the centered calendar from the icon. When false (default), the full row opens the centered calendar.
   */
  segmentedDateInput?: boolean
}) {
  if (segmentedDateInput) {
    return <DatePickerCardSegmented {...props} />
  }
  if (showTimeInModal) {
    return <OverlayDateWithModalTimePickerCard {...props} />
  }
  return <OverlayDatePickerCard {...props} />
}
