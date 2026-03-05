import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { useTokenPriceChange } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { TimePeriod, toHistoryDuration } from '~/appGraphql/data/util'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { PriceChart } from '~/components/Charts/PriceChart'
import { LineChart } from '~/components/Charts/StackedLineChart'
import { ChartType, DataQuality } from '~/components/Charts/utils'
import { VolumeChart } from '~/components/Charts/VolumeChart'
import { EXPLORE_CHART_HEIGHT_PX } from '~/components/Explore/constants'
import { ChartControls } from '~/pages/TokenDetails/components/chart/ChartControls'
import { useTDPContext } from '~/pages/TokenDetails/context/TDPContext'

export function ChartSection() {
  const { tokenColor, currency, chartState } = useTDPContext()
  const { activeQuery, timePeriod, priceChartType } = chartState
  const { t } = useTranslation()

  // Get the 24hr price change from API to ensure consistency with mobile
  // Both platforms now show the same 24hr change regardless of selected chart period
  const currencyIdValue = useMemo(() => currencyId(currency), [currency])
  const priceChange24h = useTokenPriceChange(currencyIdValue)

  // Calculate percentage change from chart data for the selected duration
  const calculatedPriceChange = useMemo(() => {
    if (activeQuery.chartType !== ChartType.PRICE || !activeQuery.entries.length) {
      return undefined
    }
    const openPrice = activeQuery.entries[0].close
    const closePrice = activeQuery.entries[activeQuery.entries.length - 1].close
    if (!openPrice || !closePrice || openPrice === 0) {
      return undefined
    }
    return ((closePrice - openPrice) / openPrice) * 100
  }, [activeQuery])

  // Use API's 24hr change for 1d, calculated change for other durations
  const pricePercentChange = timePeriod === TimePeriod.DAY ? priceChange24h : calculatedPriceChange

  // eslint-disable-next-line consistent-return
  const getSection = () => {
    if (activeQuery.dataQuality === DataQuality.INVALID) {
      return (
        <ChartSkeleton
          type={activeQuery.chartType}
          height={EXPLORE_CHART_HEIGHT_PX}
          errorText={activeQuery.loading ? undefined : t('chart.error.tokens')}
        />
      )
    }

    const stale = activeQuery.dataQuality === DataQuality.STALE
    switch (activeQuery.chartType) {
      case ChartType.PRICE:
        return (
          <PriceChart
            data={activeQuery.entries}
            height={EXPLORE_CHART_HEIGHT_PX}
            type={priceChartType}
            stale={stale}
            timePeriod={toHistoryDuration(timePeriod)}
            pricePercentChange={pricePercentChange}
            overrideColor={tokenColor}
          />
        )
      case ChartType.VOLUME:
        return (
          <VolumeChart
            data={activeQuery.entries}
            height={EXPLORE_CHART_HEIGHT_PX}
            timePeriod={timePeriod}
            stale={stale}
            overrideColor={tokenColor}
          />
        )
      case ChartType.TVL:
        return (
          <LineChart
            data={activeQuery.entries}
            height={EXPLORE_CHART_HEIGHT_PX}
            stale={stale}
            overrideColor={tokenColor}
          />
        )
    }
  }

  return (
    <Flex
      data-cy={`tdp-${activeQuery.chartType}-chart-container`}
      testID={`tdp-${activeQuery.chartType}-chart-container`}
    >
      {getSection()}
      <ChartControls />
    </Flex>
  )
}
