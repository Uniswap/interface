import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { DateRangePickerCard } from '~/pages/Liquidity/CreateAuction/components/DatePicker/DateRangePickerCard'

const MIN_START_TIME_OFFSET_MINUTES = 5

export function getMinStartTime(): Date {
  const min = new Date()
  min.setMinutes(min.getMinutes() + MIN_START_TIME_OFFSET_MINUTES)
  return min
}

export function DurationSection({
  startTime,
  endTime,
  onChange,
}: {
  startTime: Date | undefined
  endTime: Date | undefined
  onChange: (next: { startTime: Date | undefined; endTime: Date | undefined }) => void
}) {
  const { t } = useTranslation()
  const minStartTime = getMinStartTime()
  const isStartTimeInvalid = startTime !== undefined && startTime.getTime() < minStartTime.getTime()
  const isRangeInvalid = startTime !== undefined && endTime !== undefined && endTime.getTime() <= startTime.getTime()

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
        startLabel={t('toucan.createAuction.step.configureAuction.duration.startDate')}
        endLabel={t('toucan.createAuction.step.configureAuction.duration.endDate')}
        startDate={startTime}
        endDate={endTime}
        minStartDate={minStartTime}
        startPlaceholder={t('toucan.createAuction.step.configureAuction.duration.startDate.placeholder')}
        endPlaceholder={t('toucan.createAuction.step.configureAuction.duration.endDate.placeholder')}
        ariaLabelStart={t('toucan.createAuction.step.configureAuction.duration.startDate')}
        ariaLabelEnd={t('toucan.createAuction.step.configureAuction.duration.endDate')}
        onChange={(next) => onChange({ startTime: next.startDate, endTime: next.endDate })}
      />
      {isStartTimeInvalid && (
        <Text variant="body4" color="$statusCritical" textAlign="center">
          {t('toucan.createAuction.step.configureAuction.duration.startTime.error')}
        </Text>
      )}
      {!isStartTimeInvalid && isRangeInvalid && (
        <Text variant="body4" color="$statusCritical" textAlign="center">
          {t('toucan.createAuction.step.configureAuction.duration.range.error')}
        </Text>
      )}
    </Flex>
  )
}
