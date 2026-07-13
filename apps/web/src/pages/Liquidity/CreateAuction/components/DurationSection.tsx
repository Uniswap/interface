import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import {
  DateRangePickerCard,
  type DateRangePickerCardHandle,
} from '~/pages/Liquidity/CreateAuction/components/DatePicker/DateRangePickerCard'
import { useCreateAuctionTokenColor } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionTokenColor'
import {
  CREATE_AUCTION_MIN_LEAD_MINUTES_TO_PROCEED,
  formatLeadMinutesLabel,
  getMinAuctionStartTimeToProceed,
  getMinStartTime,
} from '~/pages/Liquidity/CreateAuction/utils/duration'

export type DurationSectionHandle = {
  openCalendar: (mode: 'start' | 'end') => void
}

type DurationSectionProps = {
  startTime: Date | undefined
  endTime: Date | undefined
  /** Inline error when the chosen window can't produce a valid emission schedule (mirrors backend). */
  scheduleError?: string
  onChange: (next: { startTime: Date | undefined; endTime: Date | undefined }) => void
}

export const DurationSection = forwardRef<DurationSectionHandle, DurationSectionProps>(function DurationSection(
  { startTime, endTime, scheduleError, onChange },
  ref,
) {
  const { t } = useTranslation()
  const tokenColor = useCreateAuctionTokenColor()
  const dateRangePickerRef = useRef<DateRangePickerCardHandle>(null)
  const minProceedLeadTimeLabel = useMemo(
    () => formatLeadMinutesLabel(CREATE_AUCTION_MIN_LEAD_MINUTES_TO_PROCEED, t),
    [t],
  )
  const minStartTime = getMinStartTime()
  const minProceedStartTime = getMinAuctionStartTimeToProceed()
  const isStartTimeInvalid = startTime !== undefined && startTime.getTime() < minProceedStartTime.getTime()
  const isRangeInvalid = startTime !== undefined && endTime !== undefined && endTime.getTime() <= startTime.getTime()

  useImperativeHandle(
    ref,
    () => ({
      openCalendar: (mode) => dateRangePickerRef.current?.openCalendar(mode),
    }),
    [],
  )

  return (
    <Flex gap="$spacing12">
      <Flex gap="$spacing4">
        <Text variant="subheading1" color="$neutral1">
          {t('toucan.createAuction.step.configureAuction.duration')}
        </Text>
        <Text variant="body3" color="$neutral2">
          {t('toucan.createAuction.step.configureAuction.duration.description')}
        </Text>
      </Flex>
      <DateRangePickerCard
        ref={dateRangePickerRef}
        startLabel={t('toucan.createAuction.step.configureAuction.duration.startDate')}
        endLabel={t('toucan.createAuction.step.configureAuction.duration.endDate')}
        startTimeLabel={t('toucan.createAuction.step.configureAuction.duration.startTime')}
        endTimeLabel={t('toucan.createAuction.step.configureAuction.duration.endTime')}
        startDate={startTime}
        endDate={endTime}
        minStartDate={minStartTime}
        startPlaceholder={t('toucan.createAuction.step.configureAuction.duration.startDate.placeholder')}
        endPlaceholder={t('toucan.createAuction.step.configureAuction.duration.endDate.placeholder')}
        ariaLabelStart={t('toucan.createAuction.step.configureAuction.duration.startDate')}
        ariaLabelEnd={t('toucan.createAuction.step.configureAuction.duration.endDate')}
        tokenColor={tokenColor}
        onChange={(next) => onChange({ startTime: next.startDate, endTime: next.endDate })}
      />
      {isStartTimeInvalid && (
        <Text variant="body4" color="$statusCritical" textAlign="center">
          {t('toucan.createAuction.step.configureAuction.duration.startTime.error', {
            time: minProceedLeadTimeLabel,
          })}
        </Text>
      )}
      {!isStartTimeInvalid && isRangeInvalid && (
        <Text variant="body4" color="$statusCritical" textAlign="center">
          {t('toucan.createAuction.step.configureAuction.duration.range.error')}
        </Text>
      )}
      {!isStartTimeInvalid && !isRangeInvalid && scheduleError && (
        <Text variant="body4" color="$statusCritical" textAlign="center">
          {scheduleError}
        </Text>
      )}
    </Flex>
  )
})
