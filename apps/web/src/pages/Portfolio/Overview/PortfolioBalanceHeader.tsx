import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { isLowVarianceRange } from 'uniswap/src/components/charts/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { chartPeriodToTimeLabel } from 'uniswap/src/features/portfolio/chartPeriod'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { useHeaderDateFormatter } from '~/components/Charts/hooks/useHeaderDateFormatter'
import { PriceChartData } from '~/components/Charts/PriceChart'
import { PriceChartDelta } from '~/components/Charts/PriceChart/PriceChartDelta'
import { getCandlestickPriceBounds } from '~/components/Charts/PriceChart/utils'
import { chartPeriodToHistoryDuration } from '~/pages/Portfolio/Overview/chartPeriodToHistoryDuration'

type ChartPercentChange = ReturnType<typeof getPortfolioChartPercentChange>

interface PortfolioBalanceHeaderProps {
  portfolioTotalBalanceUSD: number | undefined
  series: PriceChartData[]
  chartPercentChange: ChartPercentChange
  selectedPeriod: ChartPeriod
  isPortfolioZero: boolean
  isLoading: boolean
  hoveredData?: PriceChartData
}

export function PortfolioBalanceHeader({
  portfolioTotalBalanceUSD,
  series,
  chartPercentChange,
  selectedPeriod,
  isPortfolioZero,
  isLoading,
  hoveredData,
}: PortfolioBalanceHeaderProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const formatHeaderDate = useHeaderDateFormatter()

  const latestChartData = series.length ? series[series.length - 1] : undefined
  const displayedChartData = hoveredData ?? latestChartData
  const zeroPortfolioBalance = isPortfolioZero ? 0 : undefined
  const balance = hoveredData?.value ?? portfolioTotalBalanceUSD ?? latestChartData?.close ?? zeroPortfolioBalance
  const isHovering = !!hoveredData
  const showDelta = !isLoading && !isPortfolioZero && series.length >= 2 && !!displayedChartData
  const shouldTreatAsStablecoin = useMemo(() => {
    const { min, max } = getCandlestickPriceBounds(series)
    return isLowVarianceRange({ min, max, duration: chartPeriodToHistoryDuration(selectedPeriod) })
  }, [selectedPeriod, series])

  return (
    <Flex gap="$gap4" pb="$spacing4" testID={TestID.PortfolioBalanceHeader}>
      <Text variant="heading2" color={isPortfolioZero ? '$neutral3' : '$neutral1'}>
        {convertFiatAmountFormatted(balance, NumberType.PortfolioBalance)}
      </Text>
      {showDelta && (
        <Flex row gap="$gap8" alignItems="center">
          <PriceChartDelta
            startingPrice={series[0].close}
            endingPrice={displayedChartData.close}
            shouldIncludeFiatDelta
            shouldTreatAsStablecoin={shouldTreatAsStablecoin}
            pricePercentChange={chartPercentChange?.percentChange}
            isHovering={isHovering}
            hidePercent={selectedPeriod === ChartPeriod.MAX}
          />
          {isHovering ? (
            <Text variant="subheading2" display="flex" alignItems="center" color="$neutral2">
              {formatHeaderDate(hoveredData.time)}
            </Text>
          ) : (
            <Text variant="body2" color="$neutral2" ml={-4}>
              {chartPeriodToTimeLabel(t, selectedPeriod).toLocaleLowerCase()}
            </Text>
          )}
        </Flex>
      )}
    </Flex>
  )
}
