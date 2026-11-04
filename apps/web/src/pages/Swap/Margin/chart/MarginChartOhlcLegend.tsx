import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { useMarginChartHoveredCandle } from '~/pages/Swap/Margin/hooks/useMarginChartHoveredCandle'

// Reserved before the first candle lands so the chart below doesn't jump when the row fills in.
const OHLC_ROW_HEIGHT = 20

// OHLC read-off above the chart: a muted one-letter label beside each value, all four tinted by the
// candle's direction. Follows the crosshair and falls back to the latest candle off the plot.
export function MarginChartOhlcLegend({ latest }: { latest: PriceChartData | undefined }): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const hovered = useMarginChartHoveredCandle()
  const candle = hovered ?? latest

  if (!candle) {
    return <Flex height={OHLC_ROW_HEIGHT} />
  }

  const color = candle.close >= candle.open ? '$statusSuccess' : '$statusCritical'
  const entries = [
    { key: 'open', label: t('margin.chart.ohlc.open'), value: candle.open },
    { key: 'high', label: t('margin.chart.ohlc.high'), value: candle.high },
    { key: 'low', label: t('margin.chart.ohlc.low'), value: candle.low },
    { key: 'close', label: t('margin.chart.ohlc.close'), value: candle.close },
  ]

  return (
    <Flex row alignItems="center" height={OHLC_ROW_HEIGHT} gap="$spacing12" testID={TestID.MarginChartOhlcLegend}>
      {entries.map(({ key, label, value }) => (
        <Flex key={key} row alignItems="center" gap="$spacing4">
          <Text variant="body4" color="$neutral3">
            {label}
          </Text>
          <Text variant="body4" color={color}>
            {convertFiatAmountFormatted(value, NumberType.FiatTokenPrice)}
          </Text>
        </Flex>
      ))}
    </Flex>
  )
}
