import { Flex, fonts, Text } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { AuctionSearchStats } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { AuctionTimePhase, getAuctionTimePhase } from 'uniswap/src/features/toucan/auctionTimePhase'
import { formatCommittedUsd } from 'uniswap/src/features/toucan/formatCommittedUsd'
import { getDurationRemainingString } from 'utilities/src/time/duration'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useSharedMachineTimeMs } from 'utilities/src/time/useSharedMachineTimeMs'

const STATUS_DOT_SIZE = 4

function PhaseText({ children }: { children: string }): JSX.Element {
  return (
    <Text variant="body4" color="$neutral2" numberOfLines={1}>
      {children}
    </Text>
  )
}

function EndedText(): JSX.Element {
  const { t } = useTranslation()
  return <PhaseText>{t('common.ended')}</PhaseText>
}

function CommittedVolume({ committedVolumeUsd }: Pick<AuctionSearchStats, 'committedVolumeUsd'>): JSX.Element | null {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  if (committedVolumeUsd === undefined) {
    return null
  }
  return (
    <>
      <Text variant="body2" color="$neutral1">
        {formatCommittedUsd({ usd: committedVolumeUsd, convertFiatAmountFormatted })}
      </Text>
      <Text variant="body2" color="$neutral3">
        {t('search.results.stats.committed')}
      </Text>
    </>
  )
}

function StatsLines({ headline, phaseLabel }: { headline: ReactNode; phaseLabel: ReactNode }): JSX.Element {
  // Fixed heights keep the headline on the title line when the phase line is absent; the right slot is vertically centered.
  return (
    <Flex alignItems="flex-end">
      <Flex row alignItems="center" gap="$spacing4" height={fonts.body2.lineHeight}>
        {headline}
      </Flex>
      <Flex height={fonts.body4.lineHeight} justifyContent="center">
        {phaseLabel}
      </Flex>
    </Flex>
  )
}

function PhaseLabel({
  phaseState,
  nowMs,
}: {
  phaseState: ReturnType<typeof getAuctionTimePhase>
  nowMs: number
}): JSX.Element | null {
  const { t } = useTranslation()

  switch (phaseState.phase) {
    case AuctionTimePhase.Upcoming:
      return (
        <PhaseText>
          {t('search.results.auction.startsIn', { time: getDurationRemainingString(phaseState.startTimeMs, nowMs) })}
        </PhaseText>
      )
    case AuctionTimePhase.Live:
      return (
        <Flex row alignItems="center" gap="$spacing6">
          <Flex
            width={STATUS_DOT_SIZE}
            height={STATUS_DOT_SIZE}
            borderRadius="$roundedFull"
            backgroundColor="$accent1"
          />
          <PhaseText>
            {t('search.results.auction.timeRemaining', {
              time: getDurationRemainingString(phaseState.endTimeMs, nowMs),
            })}
          </PhaseText>
        </Flex>
      )
    case AuctionTimePhase.Ended:
      return <EndedText />
    default:
      return null
  }
}

function StartingSoon(): JSX.Element {
  const { t } = useTranslation()
  return (
    <Text variant="body2" color="$neutral2">
      {t('toucan.auction.status.startingSoon')}
    </Text>
  )
}

function TickingStats({
  committedVolumeUsd,
  startTimeMs,
  endTimeMs,
  isUpcoming,
}: Omit<AuctionSearchStats, 'isEnded'>): JSX.Element {
  const nowMs = useSharedMachineTimeMs(ONE_SECOND_MS)
  const phaseState = getAuctionTimePhase({ startTimeMs, endTimeMs, nowMs })
  // The times decide when they can; the BE lifecycle covers an upcoming row with no start estimate.
  const isStartingSoon =
    phaseState.phase === AuctionTimePhase.Upcoming || (isUpcoming && phaseState.phase === AuctionTimePhase.Unknown)

  return (
    <StatsLines
      headline={isStartingSoon ? <StartingSoon /> : <CommittedVolume committedVolumeUsd={committedVolumeUsd} />}
      phaseLabel={<PhaseLabel phaseState={phaseState} nowMs={nowMs} />}
    />
  )
}

export function AuctionOptionItemStats({
  committedVolumeUsd,
  startTimeMs,
  endTimeMs,
  isEnded,
  isUpcoming,
}: AuctionSearchStats): JSX.Element {
  // Skips the 1s ticker for rows the BE already marks ended or that have no times.
  if (isEnded || (startTimeMs === undefined && endTimeMs === undefined)) {
    return (
      <StatsLines
        headline={isUpcoming ? <StartingSoon /> : <CommittedVolume committedVolumeUsd={committedVolumeUsd} />}
        phaseLabel={isEnded ? <EndedText /> : null}
      />
    )
  }
  return (
    <TickingStats
      committedVolumeUsd={committedVolumeUsd}
      startTimeMs={startTimeMs}
      endTimeMs={endTimeMs}
      isUpcoming={isUpcoming}
    />
  )
}
