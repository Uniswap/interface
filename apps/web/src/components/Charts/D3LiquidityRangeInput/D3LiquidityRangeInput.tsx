import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import D3LiquidityRangeChart from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/D3LiquidityRangeChart'
import { ChartStoreProvider } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/ChartStoreProvider'
import { useDensityChartData } from 'components/Charts/LiquidityRangeInput/hooks'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { ChartErrorView } from 'components/Charts/LoadingState'
import { PriceChartData } from 'components/Charts/PriceChart'
import { usePoolPriceChartData } from 'hooks/usePoolPriceChartData'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Shine, Text } from 'ui/src'
import { HorizontalDensityChart } from 'ui/src/components/icons/HorizontalDensityChart'
import { LoadingPriceCurve } from 'ui/src/components/icons/LoadingPriceCurve'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'

const MIN_DATA_POINTS = 5

/**
 * Chart input for selecting the min/max prices for a liquidity position.
 */
export function D3LiquidityRangeInput({
  quoteCurrency,
  sdkCurrencies,
  priceInverted,
  feeTier,
  tickSpacing,
  protocolVersion,
  poolId,
  poolOrPairLoading,
  hook,
  currentPrice,
}: {
  quoteCurrency: Currency
  sdkCurrencies: {
    TOKEN0: Maybe<Currency>
    TOKEN1: Maybe<Currency>
  }
  priceInverted: boolean
  feeTier: number | string
  tickSpacing?: number
  protocolVersion: ProtocolVersion
  hook?: string
  poolId?: string
  poolOrPairLoading?: boolean
  currentPrice?: number
}) {
  const { t } = useTranslation()
  const chainInfo = getChainInfo(quoteCurrency.chainId)

  // Fetch price data for the chart
  const priceData = usePoolPriceChartData({
    // If the Pool doesn't exist, the poolId is undefined and we skip this query.
    variables: {
      addressOrId: poolId,
      chain: chainInfo.backendChain.chain,
      duration: HistoryDuration.Month,
      isV4: protocolVersion === ProtocolVersion.V4,
      isV3: protocolVersion === ProtocolVersion.V3,
      isV2: false,
    },
    priceInverted,
  })

  // Convert current price to PriceChartData point
  const currentPriceData: PriceChartData | undefined = useMemo(() => {
    if (!currentPrice) {
      return undefined
    }
    return {
      time: (new Date().getTime() / 1000) as UTCTimestamp,
      value: currentPrice,
      open: currentPrice,
      high: currentPrice,
      low: currentPrice,
      close: currentPrice,
    }
  }, [currentPrice])

  // Append current price to price data
  const finalPriceData = useMemo(() => {
    return {
      ...priceData,
      entries: [...priceData.entries, currentPriceData].filter(Boolean) as PriceChartData[],
    }
  }, [priceData, currentPriceData])

  // Fetch liquidity data for the chart
  const { formattedData: liquidityData, isLoading: liquidityDataLoading } = useDensityChartData({
    poolId,
    sdkCurrencies,
    priceInverted,
    version: protocolVersion,
    feeAmount: Number(feeTier),
    tickSpacing,
    hooks: hook ?? ZERO_ADDRESS,
  })

  const sortedLiquidityData = useMemo(() => {
    if (!liquidityData) {
      return undefined
    }
    const uniqueTicksMap = new Map<number | undefined, ChartEntry>()
    liquidityData.forEach((entry) => {
      uniqueTicksMap.set(entry.tick, entry)
    })

    // Convert Map values back to array and sort
    return Array.from(uniqueTicksMap.values()).sort((a, b) => a.price0 - b.price0)
  }, [liquidityData])

  // Error handling
  const showChartErrorView =
    (!poolOrPairLoading && !finalPriceData.loading && finalPriceData.entries.length < MIN_DATA_POINTS) ||
    (!liquidityDataLoading && !sortedLiquidityData) ||
    (!liquidityDataLoading && sortedLiquidityData && sortedLiquidityData.length < MIN_DATA_POINTS)

  return (
    <Flex id="d3-liquidity-range-input">
      {showChartErrorView && (
        <ChartErrorView>
          <Text variant="body3" color="$neutral2">
            {t('position.setRange.inputsBelow')}
          </Text>
        </ChartErrorView>
      )}

      {(finalPriceData.loading || liquidityDataLoading || showChartErrorView) && (
        <Flex width="100%" row alignItems="center" justifyContent="space-around">
          <Shine height={CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT} disabled={showChartErrorView} zIndex={0}>
            <LoadingPriceCurve size={CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT} color="$neutral2" />
          </Shine>
          <Shine justifyContent="center" height={CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT} disabled={showChartErrorView}>
            <HorizontalDensityChart color="$neutral2" size={CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH} />
          </Shine>
        </Flex>
      )}
      {sortedLiquidityData &&
        finalPriceData.entries.length > 0 &&
        !showChartErrorView &&
        !finalPriceData.loading &&
        !liquidityDataLoading && (
          <ChartStoreProvider priceData={finalPriceData.entries} liquidityData={sortedLiquidityData}>
            <D3LiquidityRangeChart priceData={finalPriceData.entries} liquidityData={sortedLiquidityData} />
          </ChartStoreProvider>
        )}
    </Flex>
  )
}
