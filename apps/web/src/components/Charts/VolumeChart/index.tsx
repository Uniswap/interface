import { t, Trans } from '@lingui/macro'
import { ChartHeader } from 'components/Charts/ChartHeader'
import { Chart, ChartModelParams } from 'components/Charts/ChartModel'
import { useHeaderDateFormatter } from 'components/Charts/hooks'
import Column from 'components/Column'
import { BIPS_BASE } from 'constants/misc'
import { PricePoint, TimePeriod, toHistoryDuration } from 'graphql/data/util'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { CustomVolumeChartModel, CustomVolumeChartModelParams } from './CustomVolumeChartModel'
import { SingleHistogramData } from './renderer'

class VolumeChartModel extends CustomVolumeChartModel<SingleHistogramData> {
  constructor(chartDiv: HTMLDivElement, params: ChartModelParams<SingleHistogramData> & CustomVolumeChartModelParams) {
    super(chartDiv, params)
  }

  updateOptions(params: ChartModelParams<SingleHistogramData> & CustomVolumeChartModelParams) {
    const volumeChartOptions = {
      autoSize: true,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.3,
          bottom: 0,
        },
      },
      handleScale: {
        axisPressedMouseMove: false,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    }

    super.updateOptions(params, volumeChartOptions)
  }
}

export function getTimePeriodDisplay(timePeriod: TimePeriod) {
  return t`Past ${toHistoryDuration(timePeriod).toLowerCase()}`
}

function VolumeChartHeader({
  crosshairData,
  timePeriod,
  feeTier,
  noFeesData,
}: {
  crosshairData?: SingleHistogramData
  timePeriod: TimePeriod
  feeTier?: number
  noFeesData: boolean
}) {
  const { formatFiatPrice } = useFormatter()
  const headerDateFormatter = useHeaderDateFormatter()

  const display = useMemo(() => {
    const mockDisplay = {
      volume: '-',
      fees: '-',
      time: '-',
    }
    const priceFormatter = (price?: number) =>
      formatFiatPrice({
        price,
        type: NumberType.FiatTokenStatChartHeader,
      })
    if (!crosshairData) {
      // TODO: use timePeriod to get cumulative data
      const mockCumulativeVolume = Math.random() * 1e10
      mockDisplay.volume = priceFormatter(mockCumulativeVolume)
      mockDisplay.fees = priceFormatter(mockCumulativeVolume * ((feeTier ?? 0) / BIPS_BASE / 100))
      mockDisplay.time = t`Past ${toHistoryDuration(timePeriod).toLowerCase()}`
    } else {
      mockDisplay.volume = priceFormatter(crosshairData.value)
      const fees = crosshairData.value * ((feeTier ?? 0) / BIPS_BASE / 100)
      mockDisplay.fees = priceFormatter(fees)
      mockDisplay.time = headerDateFormatter(crosshairData.time)
    }
    return mockDisplay
  }, [crosshairData, feeTier, formatFiatPrice, headerDateFormatter, timePeriod])

  return (
    <ChartHeader
      value={
        noFeesData ? (
          <ThemedText.HeadlineLarge color="inherit">{display.volume}</ThemedText.HeadlineLarge>
        ) : (
          <Column>
            <ThemedText.HeadlineSmall color="inherit">
              {display.volume} <Trans>volume</Trans>
            </ThemedText.HeadlineSmall>
            <ThemedText.HeadlineSmall color="inherit">
              {display.fees} <Trans>fees</Trans>
            </ThemedText.HeadlineSmall>
          </Column>
        )
      }
      time={crosshairData?.time}
      timePlaceholder={getTimePeriodDisplay(timePeriod)}
    />
  )
}

interface VolumeChartProps {
  height: number
  volumes?: PricePoint[]
  feeTier?: number
  timePeriod: TimePeriod
  color?: string
}

export function VolumeChart({ height, volumes, feeTier, timePeriod, color }: VolumeChartProps) {
  const theme = useTheme()

  const data: SingleHistogramData[] = useMemo(
    () =>
      volumes?.map((volumePoint) => {
        return { value: volumePoint.value, time: volumePoint.timestamp as UTCTimestamp }
      }) ?? [],
    [volumes]
  )

  const noFeesData = feeTier === undefined // i.e. if is token volume chart
  const params = useMemo(() => {
    return {
      data,
      colors: [color ?? theme.accent1],
      headerHeight: noFeesData ? 75 : 90,
    }
  }, [data, theme, color, noFeesData])

  return (
    <Chart Model={VolumeChartModel} params={params} height={height}>
      {(crosshairData) => (
        <VolumeChartHeader
          crosshairData={crosshairData}
          timePeriod={timePeriod}
          feeTier={feeTier}
          noFeesData={noFeesData}
        />
      )}
    </Chart>
  )
}
