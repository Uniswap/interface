import { NativeCurrency, Token } from '@uniswap/sdk-core'
import { useMemo, useState } from 'react'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Chart } from '~/components/Charts/ChartModel'
import { PriceChartData, PriceChartModel } from '~/components/Charts/PriceChart'
import type { SingleHistogramData } from '~/components/Charts/VolumeChart/utils'
import {
  PdpPriceChartHeader,
  useAxisFractionDigits,
} from '~/pages/PoolDetails/components/ChartSection/PdpPriceChartHeader'
import type { PriceChartZoomParams } from '~/pages/PoolDetails/components/ChartSection/usePriceChartZoom'
import { VolumeHoverTooltip } from '~/pages/PoolDetails/components/ChartSection/VolumeHoverTooltip'
import { usePdpChartRangeBand } from '~/pages/PoolDetails/components/LiquidityPanel/PdpChartRangeContext'
import { PriceChartType } from '~/utils/charts'
import { formatPriceWithSubscript } from '~/utils/formatPriceWithSubscript'

export const PDP_CHART_HEIGHT_PX = 356

/** The Price tab's price history (a line, or candles), with the deposit range over it and volume along its foot. */
export function PdpPriceChart({
  tokenA,
  tokenB,
  isReversed,
  data,
  priceSeries,
  candleIntervalSeconds,
  stale,
  overrideColor,
  zoomParams,
  volumeData,
}: {
  tokenA: Token | NativeCurrency
  tokenB: Token | NativeCurrency
  isReversed: boolean
  data: PriceChartData[]
  /**
   * The flat price samples, ending at the live spot, that `data` is drawn from. The resting header reads its price
   * and change from these, so it stays put across the line/candles toggle.
   */
  priceSeries: PriceChartData[]
  /** Set when `data` is candles of this width, drawn as candlesticks. */
  candleIntervalSeconds?: number
  stale: boolean
  overrideColor?: string
  zoomParams?: PriceChartZoomParams
  volumeData?: SingleHistogramData[]
}) {
  const { formatNumberOrString } = useLocalizationContext()
  const locale = useCurrentLocale()
  const axisFractionDigits = useAxisFractionDigits(data)

  const yAxisFormatter = useMemo(
    () => (price: number) =>
      formatPriceWithSubscript({ price, locale, formatNumberOrString, fractionDigits: axisFractionDigits }),
    [locale, formatNumberOrString, axisFractionDigits],
  )

  const { rangeBand, onRangeBandChange, onRangeBandPreview } = usePdpChartRangeBand(isReversed)
  // The volume bar whose bucket is under the crosshair, if any.
  const [hoveredVolumeBar, setHoveredVolumeBar] = useState<SingleHistogramData>()
  // The bars are placed by the series' timestamps, and a candle is drawn centred on its bucket's start, so
  // shifting the bars back half a candle lines a bucket's volume up under the candle covering the same time.
  const plottedVolumeData = useMemo(
    () =>
      candleIntervalSeconds
        ? volumeData?.map((bar) => ({ ...bar, time: (bar.time - candleIntervalSeconds / 2) as typeof bar.time }))
        : volumeData,
    [volumeData, candleIntervalSeconds],
  )

  const params = useMemo(
    () => ({
      data,
      stale,
      type: candleIntervalSeconds ? PriceChartType.CANDLESTICK : PriceChartType.LINE,
      yAxisFormatter,
      rangeBand,
      onRangeBandChange,
      onRangeBandPreview,
      ...zoomParams,
      volumeData: plottedVolumeData,
      onVolumeBarHover: setHoveredVolumeBar,
    }),
    [
      data,
      candleIntervalSeconds,
      stale,
      yAxisFormatter,
      rangeBand,
      onRangeBandChange,
      onRangeBandPreview,
      zoomParams,
      plottedVolumeData,
    ],
  )

  return (
    <Chart
      height={PDP_CHART_HEIGHT_PX}
      Model={PriceChartModel}
      params={params}
      showDottedBackground
      // The fade would wash out the first candle: fitContent leaves it only half a bar from the edge, under the
      // fade's 40px.
      showLeftFadeOverlay={!candleIntervalSeconds}
      // With a range on show the chart takes the brand accent, as the deposit range is drawn in, not the token's.
      overrideColor={rangeBand ? undefined : overrideColor}
    >
      {(crosshairData, hover) => (
        <>
          <PdpPriceChartHeader
            tokenA={tokenA}
            tokenB={tokenB}
            isReversed={isReversed}
            data={priceSeries}
            crosshairData={crosshairData}
            fractionDigits={axisFractionDigits}
          />
          {hoveredVolumeBar && hover && <VolumeHoverTooltip bar={hoveredVolumeBar} hover={hover} />}
        </>
      )}
    </Chart>
  )
}
