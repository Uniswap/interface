import { Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import type { NearOverlay, OverlayRole } from '~/pages/Swap/Margin/chart/useMarginChartOverlays'

// Crosshair payload as augmented by MarginPriceChartModel.onSeriesHover: the RAW hovered candle plus
// the overlay hit (when the crosshair sits on a line).
export type MarginTooltipData = PriceChartData & { nearOverlay?: NearOverlay }

const APPENDED_ROW_MAX_WIDTH = 240

// Margin hover row (spec F11/F24): after the model's 300ms dwell, a plain-language explainer for the
// line under the cursor.
export function MarginChartTooltip({ data }: { data: MarginTooltipData }): JSX.Element | null {
  const { t } = useTranslation()

  const explainerFor = (role: OverlayRole): string | undefined => {
    switch (role) {
      case 'mark':
        return t('margin.chart.explain.mark')
      case 'previewEntry':
        return t('margin.chart.explain.previewEntry')
      case 'previewLiq':
        return t('margin.chart.explain.previewLiq')
      default:
        return undefined
    }
  }
  const near = data.nearOverlay
  const explainer = near?.dwellElapsed ? explainerFor(near.role) : undefined

  if (explainer === undefined) {
    return null
  }

  // The pane hides the shared tooltip shell (hideTooltipBorder), so the chrome lives here and an
  // OHLC-only hover renders nothing: the legend above the chart already reads that candle.
  return (
    <Flex
      backgroundColor="$surface2"
      borderRadius="$rounded8"
      borderWidth={1}
      borderColor="$surface3"
      p="$spacing8"
      gap="$spacing4"
      maxWidth={APPENDED_ROW_MAX_WIDTH}
    >
      <Text variant="body4" color="$neutral2">
        {explainer}
      </Text>
    </Flex>
  )
}
