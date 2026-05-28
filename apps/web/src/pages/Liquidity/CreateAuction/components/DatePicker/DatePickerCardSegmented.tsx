import type { ComponentProps } from 'react'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Flex, Input, Text, TouchableArea } from 'ui/src'
import { Calendar } from 'ui/src/components/icons/Calendar'
import { fonts } from 'ui/src/theme/fonts'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import {
  FORMAT_DATE_LONG,
  FORMAT_DATE_TIME_MEDIUM,
  useFormattedDate,
  useFormattedDateTime,
  useLocalizedDayjs,
} from 'uniswap/src/features/language/localizedDayjs'
import { CreateAuctionCalendarModal } from '~/pages/Liquidity/CreateAuction/components/DatePicker/CreateAuctionCalendarModal'
import {
  type DateFieldKey,
  type DatePickerCardBaseProps,
  getLocaleDateFieldOrder,
  pad,
} from '~/pages/Liquidity/CreateAuction/components/DatePicker/datePickerCardShared'

function stripToDigits(value: string, maxLen: number): string {
  const digits = value.replace(/\D/g, '')
  return digits.slice(0, maxLen)
}

type YearMonthDay = { year: number; month: number; day: number }

function isValidCalendarDate(ymd: YearMonthDay): boolean {
  const { year, month, day } = ymd
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return false
  }
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false
  }
  const d = new Date(year, month - 1, day)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day
}

type DateSegmentStrings = { monthStr: string; dayStr: string; yearStr: string }

function tryParseDateSegments(segments: DateSegmentStrings): Date | null {
  const { monthStr, dayStr, yearStr } = segments
  const month = Number.parseInt(monthStr, 10)
  const day = Number.parseInt(dayStr, 10)
  const year = Number.parseInt(yearStr, 10)
  if (!yearStr || !monthStr || !dayStr || yearStr.length !== 4) {
    return null
  }
  if (!isValidCalendarDate({ year, month, day })) {
    return null
  }
  return new Date(year, month - 1, day)
}

type DateTimeSegmentStrings = DateSegmentStrings & { hourStr: string; minuteStr: string }

function tryParseDateTimeSegments(segments: DateTimeSegmentStrings): Date | null {
  const { monthStr, dayStr, yearStr, hourStr, minuteStr } = segments
  const base = tryParseDateSegments({ monthStr, dayStr, yearStr })
  if (!base) {
    return null
  }
  if (!hourStr.trim() || !minuteStr.trim()) {
    return null
  }
  const hour = Number.parseInt(hourStr, 10)
  const minute = Number.parseInt(minuteStr, 10)
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null
  }
  base.setHours(hour, minute, 0, 0)
  return base
}

function segmentsFromDate(date: Date | undefined, includeTime: boolean): string[] {
  if (!date) {
    return includeTime ? ['', '', '', '', ''] : ['', '', '']
  }
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const y = String(date.getFullYear())
  if (!includeTime) {
    return [m, d, y]
  }
  return [m, d, y, pad(date.getHours()), pad(date.getMinutes())]
}

function looksLikeCompleteDate(segments: DateSegmentStrings): boolean {
  const { monthStr, dayStr, yearStr } = segments
  return Boolean(monthStr.trim() && dayStr.trim() && yearStr.trim().length === 4)
}

function looksLikeCompleteDateTime(segments: DateTimeSegmentStrings): boolean {
  const { hourStr, minuteStr, ...dateParts } = segments
  return looksLikeCompleteDate(dateParts) && Boolean(hourStr.trim() && minuteStr.trim())
}

/** Same typography tokens as `Text variant="subheading1"`; no horizontal padding so digits stay centered in narrow fields. */
const segmentInputStyle = {
  fontFamily: '$subHeading',
  fontSize: '$large',
  lineHeight: '$large',
  fontWeight: '$book',
  color: '$neutral1' as const,
  backgroundColor: '$transparent' as const,
  borderWidth: 0,
  px: '$none' as const,
  py: '$none' as const,
  height: fonts.subheading1.lineHeight,
  '$platform-web': {
    boxSizing: 'border-box' as const,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
}

type SegmentInputWithHintProps = { hint: string; segmentWidth: number | string } & ComponentProps<typeof Input>

/**
 * Native inputs clip `::placeholder` to the field width. An inert text overlay can extend past the box;
 * `aria-placeholder` keeps the hint available when the real placeholder is empty.
 */
function SegmentInputWithHint({ hint, segmentWidth, value, ...inputProps }: SegmentInputWithHintProps) {
  const showHint = String(value ?? '').length === 0
  return (
    <Flex
      position="relative"
      alignItems="center"
      justifyContent="center"
      overflow="visible"
      width={segmentWidth}
      flexShrink={0}
    >
      {showHint ? (
        <Flex
          position="absolute"
          top={0}
          bottom={0}
          left={0}
          right={0}
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
          overflow="visible"
          zIndex={0}
          aria-hidden
        >
          <Text
            userSelect="none"
            variant="body3"
            color="$neutral3"
            textAlign="center"
            $platform-web={{ whiteSpace: 'nowrap' as const }}
          >
            {hint}
          </Text>
        </Flex>
      ) : null}
      <Input
        {...inputProps}
        value={value}
        width="100%"
        placeholder=""
        zIndex={1}
        {...(showHint ? { 'aria-placeholder': hint } : {})}
      />
    </Flex>
  )
}

/** Timelock custom unlock date: per-field typing + calendar icon opens native picker only. */
export function DatePickerCardSegmented({
  label,
  date,
  minDate,
  placeholder,
  onDateChange,
  ariaLabel,
  type = 'datetime-local',
}: DatePickerCardBaseProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const { locale } = useCurrentLanguageInfo()
  const dateFieldOrder = useMemo(() => getLocaleDateFieldOrder(locale), [locale])
  const dayjsInstance = useLocalizedDayjs()
  const formattedDateLong = useFormattedDate(dayjsInstance(date), FORMAT_DATE_LONG)
  const formattedDateTime = useFormattedDateTime(dayjsInstance(date), FORMAT_DATE_TIME_MEDIUM)

  const includeTime = type === 'datetime-local'
  const formattedHeaderSummary = includeTime ? formattedDateTime : formattedDateLong
  const [monthStr, setMonthStr] = useState('')
  const [dayStr, setDayStr] = useState('')
  const [yearStr, setYearStr] = useState('')
  const [hourStr, setHourStr] = useState('')
  const [minuteStr, setMinuteStr] = useState('')

  const dateTimeKey = date?.getTime() ?? 'empty'

  useEffect(() => {
    const parts = segmentsFromDate(date, includeTime)
    setMonthStr(parts[0] ?? '')
    setDayStr(parts[1] ?? '')
    setYearStr(parts[2] ?? '')
    if (includeTime) {
      setHourStr(parts[3] ?? '')
      setMinuteStr(parts[4] ?? '')
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- dateTimeKey encodes `date` to avoid resetting segments when parent passes a new Date with the same instant
  }, [dateTimeKey, includeTime])

  const applyMinClamp = useCallback(
    (selected: Date): Date => {
      if (minDate && selected.getTime() <= minDate.getTime()) {
        return new Date(minDate.getTime() + 60000)
      }
      return selected
    },
    [minDate],
  )

  const revertSegmentsToProp = useCallback(() => {
    const parts = segmentsFromDate(date, includeTime)
    setMonthStr(parts[0] ?? '')
    setDayStr(parts[1] ?? '')
    setYearStr(parts[2] ?? '')
    if (includeTime) {
      setHourStr(parts[3] ?? '')
      setMinuteStr(parts[4] ?? '')
    }
  }, [date, includeTime])

  const handleBlurSegment = useCallback(() => {
    const dateSegs = { monthStr, dayStr, yearStr }
    if (includeTime) {
      const dateTimeSegs = { ...dateSegs, hourStr, minuteStr }
      if (looksLikeCompleteDateTime(dateTimeSegs)) {
        const parsed = tryParseDateTimeSegments(dateTimeSegs)
        if (!parsed) {
          revertSegmentsToProp()
        } else {
          onDateChange(applyMinClamp(parsed))
        }
      } else if (date) {
        // Cleared or partial segments while parent still has a value — re-sync inputs to `date`.
        revertSegmentsToProp()
      }
      return
    }

    if (looksLikeCompleteDate(dateSegs)) {
      const parsed = tryParseDateSegments(dateSegs)
      if (!parsed) {
        revertSegmentsToProp()
      } else {
        onDateChange(applyMinClamp(parsed))
      }
    } else if (date) {
      revertSegmentsToProp()
    }
  }, [
    applyMinClamp,
    date,
    dayStr,
    hourStr,
    includeTime,
    minuteStr,
    monthStr,
    onDateChange,
    revertSegmentsToProp,
    yearStr,
  ])

  const handleCalendarDaySelect = useCallback(
    (localDay: Date) => {
      const next = new Date(localDay.getFullYear(), localDay.getMonth(), localDay.getDate())
      if (includeTime) {
        const hourParsed = hourStr.trim() ? Number.parseInt(hourStr, 10) : Number.NaN
        const minuteParsed = minuteStr.trim() ? Number.parseInt(minuteStr, 10) : Number.NaN
        const hour = Number.isFinite(hourParsed) ? Math.min(23, Math.max(0, hourParsed)) : (date?.getHours() ?? 0)
        const minute = Number.isFinite(minuteParsed)
          ? Math.min(59, Math.max(0, minuteParsed))
          : (date?.getMinutes() ?? 0)
        next.setHours(hour, minute, 0, 0)
      }
      onDateChange(applyMinClamp(next))
      setCalendarOpen(false)
    },
    [applyMinClamp, date, hourStr, includeTime, minuteStr, onDateChange],
  )

  const handleMonthChange = useCallback((value: string) => {
    setMonthStr(stripToDigits(value, 2))
  }, [])

  const handleDayChange = useCallback((value: string) => {
    setDayStr(stripToDigits(value, 2))
  }, [])

  const handleYearChange = useCallback((value: string) => {
    setYearStr(stripToDigits(value, 4))
  }, [])

  const handleHourChange = useCallback((value: string) => {
    setHourStr(stripToDigits(value, 2))
  }, [])

  const handleMinuteChange = useCallback((value: string) => {
    setMinuteStr(stripToDigits(value, 2))
  }, [])

  return (
    <Flex
      flex={1}
      flexBasis={0}
      alignSelf="flex-start"
      width="100%"
      position="relative"
      flexDirection="column"
      justifyContent="flex-start"
      backgroundColor="$surface2"
      borderRadius="$rounded16"
      p="$spacing16"
      gap="$spacing4"
    >
      <Flex row alignItems="center" gap="$spacing6" width="100%">
        <Text flex={1} variant="body3" color="$neutral2">
          {label}
        </Text>
        {date ? (
          <Text flex={1} textAlign="right" variant="body3" color="$neutral3" numberOfLines={2}>
            {formattedHeaderSummary}
          </Text>
        ) : placeholder ? (
          <Text flex={1} textAlign="right" variant="body3" color="$neutral3" numberOfLines={1}>
            {placeholder}
          </Text>
        ) : null}
      </Flex>
      <Flex position="relative" row alignItems="center" gap="$spacing4" width="100%" flexWrap="wrap" overflow="visible">
        <Flex row alignItems="center" gap="$spacing4" flexShrink={0} overflow="visible">
          {dateFieldOrder.map((field: DateFieldKey, fieldIndex) => (
            <Fragment key={field}>
              {fieldIndex > 0 ? (
                <Text variant="subheading1" color="$neutral3">
                  /
                </Text>
              ) : null}
              {field === 'month' ? (
                <SegmentInputWithHint
                  hint="MM"
                  segmentWidth="2.2ch"
                  value={monthStr}
                  onChangeText={handleMonthChange}
                  onBlur={handleBlurSegment}
                  maxLength={2}
                  keyboardType="number-pad"
                  textAlign="center"
                  aria-label={`${ariaLabel}, month`}
                  {...segmentInputStyle}
                />
              ) : field === 'day' ? (
                <SegmentInputWithHint
                  hint="DD"
                  segmentWidth="2.2ch"
                  value={dayStr}
                  onChangeText={handleDayChange}
                  onBlur={handleBlurSegment}
                  maxLength={2}
                  keyboardType="number-pad"
                  textAlign="center"
                  aria-label={`${ariaLabel}, day`}
                  {...segmentInputStyle}
                />
              ) : (
                <SegmentInputWithHint
                  hint="YYYY"
                  segmentWidth="4.4ch"
                  value={yearStr}
                  onChangeText={handleYearChange}
                  onBlur={handleBlurSegment}
                  maxLength={4}
                  keyboardType="number-pad"
                  textAlign="center"
                  aria-label={`${ariaLabel}, year`}
                  {...segmentInputStyle}
                />
              )}
            </Fragment>
          ))}
          {includeTime ? (
            <>
              <Text variant="subheading1" color="$neutral3" pl="$spacing4">
                {' '}
              </Text>
              <SegmentInputWithHint
                hint="HH"
                segmentWidth={36}
                value={hourStr}
                onChangeText={handleHourChange}
                onBlur={handleBlurSegment}
                maxLength={2}
                keyboardType="number-pad"
                textAlign="center"
                aria-label={`${ariaLabel}, hour`}
                {...segmentInputStyle}
              />
              <Text variant="subheading1" color="$neutral3">
                :
              </Text>
              <SegmentInputWithHint
                hint="00"
                segmentWidth="2ch"
                value={minuteStr}
                onChangeText={handleMinuteChange}
                onBlur={handleBlurSegment}
                maxLength={2}
                keyboardType="number-pad"
                textAlign="center"
                aria-label={`${ariaLabel}, minute`}
                {...segmentInputStyle}
              />
            </>
          ) : null}
        </Flex>

        <Flex flex={1} minWidth={0} />

        <TouchableArea
          aria-label={`${ariaLabel}, open calendar`}
          alignItems="center"
          justifyContent="center"
          width={32}
          height={fonts.subheading1.lineHeight}
          flexShrink={0}
          cursor="pointer"
          onPress={() => setCalendarOpen(true)}
        >
          <Calendar size="$icon.24" color="$neutral2" pointerEvents="none" />
        </TouchableArea>
        <CreateAuctionCalendarModal
          open={calendarOpen}
          onOpenChange={setCalendarOpen}
          selected={date}
          minDate={minDate}
          pickerMode={type}
          onSelect={handleCalendarDaySelect}
        />
      </Flex>
    </Flex>
  )
}
