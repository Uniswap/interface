import type { TokenMarketStats } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { Flex, Text } from '@universe/mycelium'
import { Trans } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export function NowTradingCardStats({
  stats,
}: {
  stats: Pick<TokenMarketStats, 'fullyDilutedValuationUsd' | 'volumeUsd'> | undefined
}): JSX.Element | null {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const marketFdv = stats?.fullyDilutedValuationUsd
  const volume24h = stats?.volumeUsd
  const formatFiat = (value: number): string => convertFiatAmountFormatted(value, NumberType.FiatTokenStats)
  const showFdv = marketFdv !== undefined && Number.isFinite(marketFdv) && marketFdv > 0
  // FiatTokenStats renders 0 as "-", so treat it as missing.
  const showVolume = volume24h !== undefined && Number.isFinite(volume24h) && volume24h > 0

  if (!showFdv && !showVolume) {
    return null
  }

  return (
    <Flex row alignItems="center" gap="$spacing8" flexWrap="wrap">
      {showFdv && (
        <Text variant="body3" color="$neutral3">
          <Trans
            i18nKey="toucan.auction.nowTradingCard.fdv"
            values={{ fdv: formatFiat(marketFdv) }}
            components={{ value: <Text variant="body3" color="$neutral2" tag="span" /> }}
          />
        </Text>
      )}
      {showFdv && showVolume && <Flex width={4} height={4} borderRadius="$roundedFull" backgroundColor="$neutral3" />}
      {showVolume && (
        <Text variant="body3" color="$neutral3">
          <Trans
            i18nKey="toucan.auction.nowTradingCard.volume24h"
            values={{ volume: formatFiat(volume24h) }}
            components={{ value: <Text variant="body3" color="$neutral2" tag="span" /> }}
          />
        </Text>
      )}
    </Flex>
  )
}
