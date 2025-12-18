import { ChartPeriod, GetPortfolioChartResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { GraphQLApi } from '@universe/api'
import { ChartSkeleton } from 'components/Charts/LoadingState'
import { PriceChart, PriceChartData } from 'components/Charts/PriceChart'
import { ChartType, PriceChartType } from 'components/Charts/utils'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
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
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
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
  chartData?: GetPortfolioChartResponse
  isPending: boolean
  error?: Error | null
  selectedPeriod: ChartPeriod
  setSelectedPeriod: (period: ChartPeriod) => void
  portfolioTotalBalanceUSD?: number
  isTotalValueMatch: boolean
}

export function PortfolioChart({
  isPortfolioZero,
  chartData: portfolioChartData,
  isPending,
  error,
  portfolioTotalBalanceUSD,
  selectedPeriod,
  setSelectedPeriod,
  isTotalValueMatch,
}: PortfolioChartProps): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const colors = useSporeColors()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const locale = useCurrentLocale()
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const isChartEmpty = useMemo(() => {
    if (!portfolioChartData?.points || portfolioChartData.points.length === 0) {
      return true
    }

    // if the last point is 0, check all other points to determine if there has ever been value here
    if (portfolioChartData.points[portfolioChartData.points.length - 1].value === 0) {
      return portfolioChartData.points.every((point) => point.value === 0)
    }

    return false
  }, [portfolioChartData?.points])

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

  const chartData = useMemo(() => {
    if (!portfolioChartData?.points) {
      return []
    }
    return convertPortfolioChartDataToPriceChartData(portfolioChartData.points)
  }, [portfolioChartData])

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

  const isLoading = isPending || !chartData.length
  const isDisabled = isPortfolioZero || !!error

  // Custom y-axis formatter that removes decimals
  const yAxisFormatter = useMemo(() => {
    return (price: number): string => {
      const rounded = Math.floor(price)
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: appFiatCurrencyInfo.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      return formatter.format(rounded)
    }
  }, [locale, appFiatCurrencyInfo.code])

  return (
    <Flex gap="$spacing16" grow shrink>
      {error ? (
        <ChartContainer centered grow shrink>
          <ChartSkeleton
            type={ChartType.PRICE}
            height={CHART_HEIGHT}
            errorText={t('portfolio.overview.chart.errorText')}
          />
        </ChartContainer>
      ) : isLoading ? (
        <ChartContainer centered grow shrink>
          <ChartSkeleton type={ChartType.PRICE} height={CHART_HEIGHT} />
        </ChartContainer>
      ) : isPortfolioZero || isChartEmpty ? (
        <Flex height={UNFUNDED_CHART_SKELETON_HEIGHT} position="relative">
          <Text variant="heading1" color="$neutral3">
            {convertFiatAmountFormatted(0, NumberType.PortfolioBalance)}
          </Text>
          <Separator borderBottomWidth={3} borderColor="$surface3" position="absolute" top="60%" left="0" right="0" />
        </Flex>
      ) : (
        <Flex pointerEvents={isTotalValueMatch ? 'auto' : 'none'}>
          <PriceChart
            data={chartData}
            height={CHART_HEIGHT}
            type={PriceChartType.LINE}
            stale={false}
            timePeriod={chartPeriodToHistoryDuration(selectedPeriod)}
            overrideColor={chartColor}
            headerTotalValueOverride={portfolioTotalBalanceUSD}
            hideYAxis={!isTotalValueMatch}
            yAxisFormatter={yAxisFormatter}
          />
        </Flex>
      )}
      <Flex
        $md={{ width: '100%' }}
        opacity={isPortfolioZero ? 0.5 : 1}
        pointerEvents={isPortfolioZero ? 'none' : 'auto'}
      >
        <SegmentedControl
          disabled={isDisabled}
          fullWidth={media.md}
          options={periodOptions}
          selectedOption={String(selectedPeriod)}
          onSelectOption={(periodStr: string) => setSelectedPeriod(Number(periodStr) as ChartPeriod)}
        />
      </Flex>
    </Flex>
  )
}
