import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { Plus } from '@universe/mycelium/icons/Plus'
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import {
  DateRangePickerCard,
  type DateRangePickerCardHandle,
} from '~/pages/Liquidity/CreateAuction/components/DatePicker/DateRangePickerCard'
import {
  PreBidPeriodCard,
  type PreBidPeriodCardHandle,
} from '~/pages/Liquidity/CreateAuction/components/PreBidPeriodCard'
import { useCreateAuctionTokenColor } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionTokenColor'
import {
  CREATE_AUCTION_MIN_LEAD_MINUTES_TO_PROCEED,
  formatLeadMinutesLabel,
  getAuctionOpenTime,
  getDurationInvalidReason,
  getMinEmissionStartTime,
  seedPreBidWindow,
  shiftEndTimeToPreserveDuration,
} from '~/pages/Liquidity/CreateAuction/utils/duration'

export type DurationSectionHandle = {
  /**
   * `preBidStart` targets the pre-bid module's own input. It is a distinct mode because the
   * auction's open time IS the pre-bid start when a window is set, and no date picked in the
   * Duration card can clear an invalid one.
   */
  openCalendar: (mode: 'start' | 'end' | 'preBidStart') => void
}

type DurationSectionProps = {
  startTime: Date | undefined
  endTime: Date | undefined
  /** Set when the creator has added a pre-bid window; `undefined` means the module is off. */
  preBidStartTime: Date | undefined
  /** Inline error when the chosen window can't produce a valid emission schedule (mirrors backend). */
  scheduleError?: string
  onChange: (next: {
    startTime: Date | undefined
    endTime: Date | undefined
    preBidStartTime: Date | undefined
  }) => void
}

export const DurationSection = forwardRef<DurationSectionHandle, DurationSectionProps>(function DurationSection(
  { startTime, endTime, preBidStartTime, scheduleError, onChange },
  ref,
) {
  const { t } = useTranslation()
  const tokenColor = useCreateAuctionTokenColor()
  const dateRangePickerRef = useRef<DateRangePickerCardHandle>(null)
  const preBidCardRef = useRef<PreBidPeriodCardHandle>(null)
  const minProceedLeadTimeLabel = useMemo(
    () => formatLeadMinutesLabel(CREATE_AUCTION_MIN_LEAD_MINUTES_TO_PROCEED, t),
    [t],
  )
  // One ordered answer, shared with the step gate and the disabled-Continue affordance, so all
  // three agree on which field is at fault. Only surfaced once the field is filled in: an empty
  // picker is not an error the creator needs shouting about yet.
  const invalidReason = getDurationInvalidReason({ startTime, endTime, preBidStartTime })
  const hasAuctionOpenTime = getAuctionOpenTime({ startTime, preBidStartTime }) !== undefined

  useImperativeHandle(
    ref,
    () => ({
      openCalendar: (mode) =>
        mode === 'preBidStart'
          ? preBidCardRef.current?.openStartCalendar()
          : dateRangePickerRef.current?.openCalendar(mode),
    }),
    [],
  )

  return (
    <Flex gap="$spacing12">
      <Flex gap="$spacing4">
        <Text variant="subheading1" $md={{ variant: 'subheading2' }} color="$neutral1">
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
        minStartDate={getMinEmissionStartTime(preBidStartTime)}
        startPlaceholder={t('toucan.createAuction.step.configureAuction.duration.startDate.placeholder')}
        endPlaceholder={t('toucan.createAuction.step.configureAuction.duration.endDate.placeholder')}
        ariaLabelStart={t('toucan.createAuction.step.configureAuction.duration.startDate')}
        ariaLabelEnd={t('toucan.createAuction.step.configureAuction.duration.endDate')}
        tokenColor={tokenColor}
        // Edits here win outright: the end date is whatever the creator picked. The same boundary
        // edited through the pre-bid module instead carries the end date along to preserve the
        // configured length — see the `onChange` below. The two are presented as one field, so the
        // asymmetry is only visible from these two call sites.
        onChange={(next) => onChange({ startTime: next.startDate, endTime: next.endDate, preBidStartTime })}
      />
      {preBidStartTime ? (
        <PreBidPeriodCard
          ref={preBidCardRef}
          preBidStartTime={preBidStartTime}
          startTime={startTime}
          // The end date is not editable from this module, so any emission start it moves is a
          // pre-bid-driven move: carry the end date along to keep the configured auction length.
          // Deliberately NOT symmetric with the Duration card above: moving the boundary from
          // this side preserves the configured auction length rather than shortening it.
          onChange={(next) =>
            onChange({
              ...next,
              endTime: shiftEndTimeToPreserveDuration({
                previousStartTime: startTime,
                nextStartTime: next.startTime,
                endTime,
              }),
            })
          }
          onRemove={() => onChange({ startTime, endTime, preBidStartTime: undefined })}
        />
      ) : (
        <Trace logPress element={ElementName.AuctionPreBidAdd}>
          <TouchableArea
            row
            alignItems="center"
            gap="$spacing4"
            alignSelf="flex-start"
            px="$spacing8"
            py="$spacing6"
            borderRadius="$rounded16"
            hoverStyle={{ backgroundColor: '$surface3' }}
            onPress={() => {
              const seeded = seedPreBidWindow(startTime)
              onChange({
                ...seeded,
                endTime: shiftEndTimeToPreserveDuration({
                  previousStartTime: startTime,
                  nextStartTime: seeded.startTime,
                  endTime,
                }),
              })
            }}
          >
            <Plus size="$icon.16" color="$neutral2" />
            <Text variant="buttonLabel4" color="$neutral2">
              {t('toucan.createAuction.step.configureAuction.preBid.add')}
            </Text>
          </TouchableArea>
        </Trace>
      )}
      {invalidReason === 'auction-open-too-soon' && hasAuctionOpenTime && (
        <Text variant="body4" color="$statusCritical" textAlign="center">
          {/* Literal keys, not a computed one: the i18n extractor only sees static `t('...')` calls
              and would prune a key it cannot find a reference to. */}
          {preBidStartTime
            ? t('toucan.createAuction.step.configureAuction.preBid.startTime.error', {
                time: minProceedLeadTimeLabel,
              })
            : t('toucan.createAuction.step.configureAuction.duration.startTime.error', {
                time: minProceedLeadTimeLabel,
              })}
        </Text>
      )}
      {invalidReason === 'pre-bid-order' && startTime !== undefined && (
        <Text variant="body4" color="$statusCritical" textAlign="center">
          {t('toucan.createAuction.step.configureAuction.preBid.range.error')}
        </Text>
      )}
      {invalidReason === 'range' && startTime !== undefined && endTime !== undefined && (
        <Text variant="body4" color="$statusCritical" textAlign="center">
          {t('toucan.createAuction.step.configureAuction.duration.range.error')}
        </Text>
      )}
      {invalidReason === undefined && scheduleError && (
        <Text variant="body4" color="$statusCritical" textAlign="center">
          {scheduleError}
        </Text>
      )}
    </Flex>
  )
})
