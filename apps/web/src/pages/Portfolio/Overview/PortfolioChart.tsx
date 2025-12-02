import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { GraphQLApi } from '@universe/api'
import { ChartSkeleton } from 'components/Charts/LoadingState'
import { PriceChart, PriceChartData } from 'components/Charts/PriceChart'
import { ChartType, PriceChartType } from 'components/Charts/utils'
import { UTCTimestamp } from 'lightweight-charts'
import { usePortfolioRoutes } from 'pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from 'pages/Portfolio/hooks/usePortfolioAddresses'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SegmentedControl,
  SegmentedControlOption,
  Separator,
  styled,
  Text,
  useMedia,
  useSporeColors,
} from 'ui/src'
import { useGetPortfolioHistoricalValueChartQuery } from 'uniswap/src/data/rest/getPortfolioChart'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

const ChartContainer = styled(Flex, {
  width: '100%',
})

const CHART_HEIGHT = 300
const UNFUNDED_CHART_SKELETON_HEIGHT = 275

// Map ChartPeriod to GraphQLApi.HistoryDuration for PriceChart display
function chartPeriodToHistoryDuration(period: ChartPeriod): GraphQLApi.HistoryDuration {
  switch (period) {
    case ChartPeriod.HOUR:
      return GraphQLApi.HistoryDuration.Hour
    case ChartPeriod.DAY:
      return GraphQLApi.HistoryDuration.Day
    case ChartPeriod.WEEK:
      return GraphQLApi.HistoryDuration.Week
    case ChartPeriod.MONTH:
      return GraphQLApi.HistoryDuration.Month
    case ChartPeriod.YEAR:
      return GraphQLApi.HistoryDuration.Year
    default:
      return GraphQLApi.HistoryDuration.Day
  }
}

function convertPortfolioChartDataToPriceChartData(
  points: Array<{ timestamp: bigint; value: number }>,
): PriceChartData[] {
  return points.map((point) => {
    // UTCTimestamp expects seconds, and the API returns timestamps as bigint in seconds
    const time = Number(point.timestamp) as UTCTimestamp
    const value = point.value

    // For portfolio balance charts, we use line charts, so all OHLC values are the same
    return {
      time,
      value,
      open: value,
      high: value,
      low: value,
      close: value,
    }
  })
}

interface PortfolioChartProps {
  isPortfolioZero: boolean
}

export function PortfolioChart({ isPortfolioZero }: PortfolioChartProps): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const colors = useSporeColors()
  const { chainId } = usePortfolioRoutes()
  const portfolioAddresses = usePortfolioAddresses()
  const { chains: chainIds } = useEnabledChains()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>(ChartPeriod.DAY)

  const periodOptions = useMemo<Array<SegmentedControlOption<string>>>(() => {
    const options: Array<[ChartPeriod, string]> = [
      [ChartPeriod.DAY, t('token.priceExplorer.timeRangeLabel.day')],
      [ChartPeriod.WEEK, t('token.priceExplorer.timeRangeLabel.week')],
      [ChartPeriod.MONTH, t('token.priceExplorer.timeRangeLabel.month')],
      [ChartPeriod.YEAR, t('token.priceExplorer.timeRangeLabel.year')],
    ]

    return options.map(([period, label]) => ({
      value: String(period),
      display: (
        <Text variant="buttonLabel4" color={period === selectedPeriod ? undefined : '$neutral2'}>
          {label}
        </Text>
      ),
    }))
  }, [selectedPeriod, t])

  const { data, isPending, error } = useGetPortfolioHistoricalValueChartQuery({
    input: {
      evmAddress: portfolioAddresses.evmAddress,
      svmAddress: portfolioAddresses.svmAddress,
      chainIds: chainId ? [chainId] : chainIds,
      chartPeriod: selectedPeriod,
    },
    enabled: !!(portfolioAddresses.evmAddress || portfolioAddresses.svmAddress),
  })

  const chartData = useMemo(() => {
    if (!data?.points) {
      return []
    }
    return convertPortfolioChartDataToPriceChartData(data.points)
  }, [data])

  // Determine color based on portfolio balance change
  const chartColor = useMemo(() => {
    if (chartData.length < 2) {
      return colors.accent1.val
    }
    const firstValue = chartData[0].value
    const lastValue = chartData[chartData.length - 1].value
    if (lastValue > firstValue) {
      return colors.statusSuccess.val
    }
    if (lastValue < firstValue) {
      return colors.statusCritical.val
    }
    return colors.statusSuccess.val
  }, [chartData, colors])

  if (error) {
    return (
      <ChartContainer centered grow shrink>
        <ChartSkeleton
          type={ChartType.PRICE}
          height={CHART_HEIGHT}
          errorText={t('portfolio.overview.chart.errorText')}
        />
      </ChartContainer>
    )
  }

  if (isPending || !chartData.length) {
    return (
      <ChartContainer centered grow shrink>
        <ChartSkeleton type={ChartType.PRICE} height={CHART_HEIGHT} />
      </ChartContainer>
    )
  }

  return (
    <Flex gap="$spacing16" grow shrink>
      {isPortfolioZero ? (
        <Flex height={UNFUNDED_CHART_SKELETON_HEIGHT} position="relative">
          <Text variant="heading1" color="$neutral3">
            {convertFiatAmountFormatted(0, NumberType.PortfolioBalance)}
          </Text>
          <Separator borderBottomWidth={3} borderColor="$surface3" position="absolute" top="60%" left="0" right="0" />
        </Flex>
      ) : (
        <PriceChart
          data={chartData}
          height={CHART_HEIGHT}
          type={PriceChartType.LINE}
          stale={false}
          timePeriod={chartPeriodToHistoryDuration(selectedPeriod)}
          overrideColor={chartColor}
        />
      )}
      <Flex
        $md={{ width: '100%' }}
        opacity={isPortfolioZero ? 0.5 : 1}
        pointerEvents={isPortfolioZero ? 'none' : 'auto'}
      >
        <SegmentedControl
          disabled={isPortfolioZero}
          fullWidth={media.md}
          options={periodOptions}
          selectedOption={String(selectedPeriod)}
          onSelectOption={(periodStr: string) => setSelectedPeriod(Number(periodStr) as ChartPeriod)}
        />
      </Flex>
    </Flex>
  )
}
