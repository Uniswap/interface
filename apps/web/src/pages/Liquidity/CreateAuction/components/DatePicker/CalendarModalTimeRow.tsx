import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text, TouchableArea } from 'ui/src'
import { fonts } from 'ui/src/theme/fonts'
import { useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import {
  formatUtcOffset,
  getLocaleUses12HourTime,
  splitTimeForDisplay,
  to24Hour,
} from '~/pages/Liquidity/CreateAuction/components/DatePicker/datePickerCardShared'

const TIME_BOX_WIDTH = 64
const TIME_BOX_HEIGHT = 55

/** Same typography as `Text variant="body1"`; explicit height matches the line-height so the box-clipped overflow doesn't crop ascenders/descenders. */
const timeInputStyle = {
  fontFamily: '$body',
  fontSize: fonts.body1.fontSize,
  lineHeight: fonts.body1.lineHeight,
  fontWeight: fonts.body1.fontWeight,
  color: '$neutral1' as const,
  backgroundColor: '$transparent' as const,
  textAlign: 'center' as const,
  height: fonts.body1.lineHeight,
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
}

export function CalendarModalTimeRow({ hour24, minute, onChange }: CalendarModalTimeRowProps) {
  const { t } = useTranslation()
  const { locale } = useCurrentLanguageInfo()
  const uses12Hour = useMemo(() => getLocaleUses12HourTime(locale), [locale])
  const utcOffset = useMemo(() => formatUtcOffset(), [])

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
      if (uses12Hour) {
        const normalized = parsed === 0 ? 12 : parsed
        const clamped = clamp({ value: normalized, min: 1, max: 12 })
        onChange(to24Hour({ hour12: clamped, period }), minute)
      } else {
        const clamped = clamp({ value: parsed, min: 0, max: 23 })
        onChange(clamped, minute)
      }
    },
    [display.hour, minute, onChange, period, uses12Hour],
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
      const clamped = clamp({ value: parsed, min: 0, max: 59 })
      onChange(hour24, clamped)
    },
    [display.minute, hour24, onChange],
  )

  const togglePeriod = useCallback(() => {
    const next: 'AM' | 'PM' = period === 'AM' ? 'PM' : 'AM'
    const hour12 = hour24 % 12 || 12
    onChange(to24Hour({ hour12, period: next }), minute)
  }, [hour24, minute, onChange, period])

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      borderTopWidth={1}
      borderTopColor="$surface3"
      pt="$spacing16"
      width="100%"
      gap="$spacing12"
    >
      <Flex row alignItems="center" gap={10} flexShrink={0}>
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
        <Text variant="body1" color="$neutral2" textAlign="center" width={12}>
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
            <Text variant="body1" color="$neutral1">
              {period}
            </Text>
          </TouchableArea>
        ) : null}
      </Flex>
      <Text
        variant="body1"
        color="$neutral2"
        textAlign="right"
        flexShrink={0}
        aria-label={t('toucan.createAuction.calendar.time.timezone')}
      >
        {utcOffset}
      </Text>
    </Flex>
  )
}
