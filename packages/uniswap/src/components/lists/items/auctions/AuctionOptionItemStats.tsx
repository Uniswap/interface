import { Flex, fonts, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import type { AuctionSearchStats } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { getDurationRemainingString } from 'utilities/src/time/duration'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useSharedMachineTimeMs } from 'utilities/src/time/useSharedMachineTimeMs'

const STATUS_DOT_SIZE = 4

function AuctionTimeRemaining({ endTimeMs }: { endTimeMs: number }): JSX.Element | null {
  const { t } = useTranslation()
  const nowMs = useSharedMachineTimeMs(ONE_SECOND_MS)

  if (endTimeMs <= nowMs) {
    return null
  }

  return (
    <Flex row alignItems="center" gap="$spacing6">
      <Flex width={STATUS_DOT_SIZE} height={STATUS_DOT_SIZE} borderRadius="$roundedFull" backgroundColor="$accent1" />
      <Text variant="body4" color="$neutral2" numberOfLines={1}>
        {t('search.results.auction.timeRemaining', { time: getDurationRemainingString(endTimeMs, nowMs) })}
      </Text>
    </Flex>
  )
}

export function AuctionOptionItemStats({ fdvUsd, endTimeMs }: AuctionSearchStats): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  // Fixed heights keep FDV on the title line when the countdown is absent; the right slot is vertically centered.
  return (
    <Flex alignItems="flex-end">
      <Flex row alignItems="center" gap="$spacing4" height={fonts.body2.lineHeight}>
        {fdvUsd !== undefined && (
          <>
            <Text variant="body2" color="$neutral1">
              {convertFiatAmountFormatted(fdvUsd, NumberType.FiatTokenStats)}
            </Text>
            <Text variant="body2" color="$neutral3">
              {t('stats.fdv')}
            </Text>
          </>
        )}
      </Flex>
      <Flex height={fonts.body4.lineHeight} justifyContent="center">
        {endTimeMs !== undefined && <AuctionTimeRemaining endTimeMs={endTimeMs} />}
      </Flex>
    </Flex>
  )
}
