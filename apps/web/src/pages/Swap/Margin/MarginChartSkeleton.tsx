import { Flex } from '@universe/mycelium'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { ChartType } from '~/components/Charts/utils'
import { marginVolumePaneHeight } from '~/pages/Swap/Margin/marginChartLayout'

/**
 * Chart loading state: the shared price + volume ChartSkeletons stacked at the real chart's split, so the
 * handoff keeps its shape. The price pane drops its title (the OHLC readout is in the pane header) and its
 * x-axis (the time ticks belong under the volume pane).
 */
export function MarginChartSkeleton({ height, testID }: { height: number; testID?: string }): JSX.Element {
  const volumeHeight = marginVolumePaneHeight(height)
  const priceHeight = Math.max(0, height - volumeHeight)
  return (
    <Flex fill minHeight={0} testID={testID}>
      <Flex height={priceHeight}>
        <ChartSkeleton type={ChartType.PRICE} height={priceHeight} hidePriceIndicators hideXAxis />
      </Flex>
      <Flex height={volumeHeight}>
        <ChartSkeleton type={ChartType.VOLUME} height={volumeHeight} hideYAxis />
      </Flex>
    </Flex>
  )
}
