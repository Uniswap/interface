import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text, TouchableArea } from 'ui/src'
import { fonts } from 'ui/src/theme/fonts'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import {
  getLocaleUses12HourTime,
  splitTimeForDisplay,
  to24Hour,
} from '~/pages/Liquidity/CreateAuction/components/DatePicker/datePickerCardShared'

const TIME_BOX_WIDTH = 40
const TIME_BOX_HEIGHT = 36

/** Same typography as `Text variant="body3"`; explicit height matches the line-height so the box-clipped overflow doesn't crop ascenders/descenders. */
const timeInputStyle = {
  fontFamily: '$body',
  fontSize: fonts.body3.fontSize,
  lineHeight: fonts.body3.lineHeight,
  fontWeight: fonts.body3.fontWeight,
  color: '$neutral1' as const,
  backgroundColor: '$transparent' as const,
  textAlign: 'center' as const,
  height: fonts.body3.lineHeight,
}

function stripToDigits(value: string, maxLen: number): string {
  return value.replace(/\D/g, '').slice(0, maxLen)
}

function clamp({ value, min, max }: { value: number; min: number; max: number }): number {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}

/** Parses the hour field the same way as `onBlur` commit; empty/invalid leaves `committedHour24` unchanged. */
function parseHourStringToHour24({
  raw,
  committedHour24,
  uses12Hour,
}: {
  raw: string
  committedHour24: number
  uses12Hour: boolean
}): number {
  const trimmed = raw.trim()
  if (!trimmed) {
    return committedHour24
  }
  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed)) {
    return committedHour24
  }
  if (uses12Hour) {
    const period = committedHour24 >= 12 ? 'PM' : 'AM'
    const normalized = parsed === 0 ? 12 : parsed
    const clamped = clamp({ value: normalized, min: 1, max: 12 })
    return to24Hour({ hour12: clamped, period })
  }
  return clamp({ value: parsed, min: 0, max: 23 })
}

/** Parses the minute field the same way as `onBlur` commit; empty/invalid leaves `committedMinute` unchanged. */
function parseMinuteStringToMinute(raw: string, committedMinute: number): number {
  const trimmed = raw.trim()
  if (!trimmed) {
    return committedMinute
  }
  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed)) {
    return committedMinute
  }
  return clamp({ value: parsed, min: 0, max: 59 })
}

function TimeBox({ children }: { children: ReactNode }) {
  return (
    <Flex
      backgroundColor="$surface2"
      borderRadius="$rounded16"
      width={TIME_BOX_WIDTH}
      height={TIME_BOX_HEIGHT}
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      flexShrink={0}
    >
      {children}
    </Flex>
  )
}

export type CalendarModalTimeRowProps = {
  hour24: number
  minute: number
  onChange: (hour24: number, minute: number) => void
  /** Caption rendered ABOVE the time inputs (e.g. "Start" / "End" in the range popover). */
  label?: string
  /** Optional content rendered to the right of `label`, on the same row (e.g. UTC offset). */
  labelTrailing?: ReactNode
}

export function CalendarModalTimeRow({ hour24, minute, onChange, label, labelTrailing }: CalendarModalTimeRowProps) {
  const { t } = useTranslation()
  const { locale } = useCurrentLanguageInfo()
  const uses12Hour = useMemo(() => getLocaleUses12HourTime(locale), [locale])
  const display = useMemo(
    () => splitTimeForDisplay(new Date(2000, 0, 1, hour24, minute), uses12Hour),
    [hour24, minute, uses12Hour],
  )
  const [hourStr, setHourStr] = useState(display.hour)
  const [minuteStr, setMinuteStr] = useState(display.minute)

  useEffect(() => {
    setHourStr(display.hour)
    setMinuteStr(display.minute)
  }, [display.hour, display.minute])

  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM'

  const commitHour = useCallback(
    (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed) {
        setHourStr(display.hour)
        return
      }
      const parsed = Number.parseInt(trimmed, 10)
      if (!Number.isFinite(parsed)) {
        setHourStr(display.hour)
        return
      }
      const nextHour24 = parseHourStringToHour24({ raw, committedHour24: hour24, uses12Hour })
      onChange(nextHour24, minute)
    },
    [display.hour, hour24, minute, onChange, uses12Hour],
  )

  const commitMinute = useCallback(
    (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed) {
        setMinuteStr(display.minute)
        return
      }
      const parsed = Number.parseInt(trimmed, 10)
      if (!Number.isFinite(parsed)) {
        setMinuteStr(display.minute)
        return
      }
      const nextMinute = parseMinuteStringToMinute(raw, minute)
      onChange(hour24, nextMinute)
    },
    [display.minute, hour24, minute, onChange],
  )

  const flushRef = useRef({
    hourStr,
    minuteStr,
    hour24,
    minute,
    uses12Hour,
    onChange,
  })
  flushRef.current = { hourStr, minuteStr, hour24, minute, uses12Hour, onChange }

  useEffect(() => {
    return () => {
      const { hourStr: hs, minuteStr: ms, hour24: h24, minute: m, uses12Hour: u12, onChange: oc } = flushRef.current
      const nextH = parseHourStringToHour24({ raw: hs, committedHour24: h24, uses12Hour: u12 })
      const nextM = parseMinuteStringToMinute(ms, m)
      if (nextH !== h24 || nextM !== m) {
        oc(nextH, nextM)
      }
    }
  }, [])

  const togglePeriod = useCallback(() => {
    const next: 'AM' | 'PM' = period === 'AM' ? 'PM' : 'AM'
    const hour12 = hour24 % 12 || 12
    onChange(to24Hour({ hour12, period: next }), minute)
  }, [hour24, minute, onChange, period])

  return (
    <Flex gap="$spacing4" alignItems="flex-start">
      {label ? (
        <Flex row alignItems="center" justifyContent="space-between" width="100%" gap="$spacing8">
          <Text variant="body3" color="$neutral2">
            {label}
          </Text>
          {labelTrailing}
        </Flex>
      ) : null}
      <Flex row alignItems="center" gap="$spacing4" flexShrink={0}>
        <TimeBox>
          <Input
            value={hourStr}
            onChangeText={(value: string) => setHourStr(stripToDigits(value, 2))}
            onBlur={() => commitHour(hourStr)}
            maxLength={2}
            keyboardType="number-pad"
            aria-label={t('toucan.createAuction.calendar.time.hour')}
            width="100%"
            {...timeInputStyle}
          />
        </TimeBox>
        <Text variant="body1" color="$neutral2" textAlign="center" width={8}>
          :
        </Text>
        <TimeBox>
          <Input
            value={minuteStr}
            onChangeText={(value: string) => setMinuteStr(stripToDigits(value, 2))}
            onBlur={() => commitMinute(minuteStr)}
            maxLength={2}
            keyboardType="number-pad"
            aria-label={t('toucan.createAuction.calendar.time.minute')}
            width="100%"
            {...timeInputStyle}
          />
        </TimeBox>
        {uses12Hour ? (
          <TouchableArea
            backgroundColor="$surface2"
            borderRadius="$rounded16"
            width={TIME_BOX_WIDTH}
            height={TIME_BOX_HEIGHT}
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            onPress={togglePeriod}
            aria-label={t('toucan.createAuction.calendar.time.period')}
          >
            <Text variant="body3" color="$neutral2">
              {period}
            </Text>
          </TouchableArea>
        ) : null}
      </Flex>
    </Flex>
  )
}
