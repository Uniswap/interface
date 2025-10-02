import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Price } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { D3LiquidityChartHeader } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/D3LiquidityChartHeader'
import { D3LiquidityMinMaxInput } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/D3LiquidityMinMaxInput'
import { DefaultPriceStrategies } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/DefaultPriceStrategies'
import { LiquidityRangeActionButtons } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/LiquidityRangeActionButtons/LiquidityRangeActionButtons'
import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import D3LiquidityRangeChart from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/D3LiquidityRangeChart'
import { LiquidityChartStoreProvider } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/LiquidityChartStoreProvider'
import { useDensityChartData } from 'components/Charts/LiquidityRangeInput/hooks'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { ChartSkeleton } from 'components/Charts/LoadingState'
import { PriceChartData } from 'components/Charts/PriceChart'
import { ChartType } from 'components/Charts/utils'
import { usePoolPriceChartData } from 'hooks/usePoolPriceChartData'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, SegmentedControlOption, Shine, Text } from 'ui/src'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'

const MIN_DATA_POINTS = 5

/**
 * Chart input for selecting the min/max prices for a liquidity position.
 */
export function D3LiquidityRangeInput({
  baseCurrency,
  quoteCurrency,
  sdkCurrencies,
  currencyControlOptions,
  priceInverted,
  feeTier,
  tickSpacing,
  protocolVersion,
  poolId,
  poolOrPairLoading,
  creatingPoolOrPair,
  price,
  hook,
  currentPrice,
  isFullRange,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  setIsFullRange,
  handleSelectToken,
}: {
  baseCurrency: Currency
  quoteCurrency: Currency
  sdkCurrencies: {
    TOKEN0: Maybe<Currency>
    TOKEN1: Maybe<Currency>
  }
  currencyControlOptions: SegmentedControlOption<string>[]
  priceInverted: boolean
  feeTier: number | string
  tickSpacing?: number
  protocolVersion: ProtocolVersion
  hook?: string
  poolId?: string
  poolOrPairLoading?: boolean
  creatingPoolOrPair?: boolean
  price?: Price<Currency, Currency>
  currentPrice?: number
  isFullRange?: boolean
  minPrice?: number
  maxPrice?: number
  setMinPrice: (minPrice?: number | null) => void
  setMaxPrice: (maxPrice?: number | null) => void
  setIsFullRange: (isFullRange: boolean) => void
  handleSelectToken: (option: string) => void
}) {
  const { t } = useTranslation()
  const chainInfo = getChainInfo(quoteCurrency.chainId)

  // TODO: consider moving this to the store - requires rearranging loading and error states
  const [selectedHistoryDuration, setSelectedHistoryDuration] = useState<GraphQLApi.HistoryDuration>(
    GraphQLApi.HistoryDuration.Month,
  )

  // Fetch price data for the chart
  const priceData = usePoolPriceChartData({
    // If the Pool doesn't exist, the poolId is undefined and we skip this query.
    variables: {
      addressOrId: poolId,
      chain: chainInfo.backendChain.chain,
      duration: selectedHistoryDuration,
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

  const isLoading = poolOrPairLoading || finalPriceData.loading || liquidityDataLoading

  return (
    <Flex id="d3-liquidity-range-input" gap="$gap4">
      <LiquidityChartStoreProvider
        selectedHistoryDuration={selectedHistoryDuration}
        minPrice={minPrice}
        maxPrice={maxPrice}
        isFullRange={isFullRange}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        onTimePeriodChange={setSelectedHistoryDuration}
        setIsFullRange={setIsFullRange}
      >
        <DefaultPriceStrategies isLoading={isLoading} />
        <Flex
          backgroundColor="$surface2"
          gap="$gap16"
          borderRadius={poolId ? '$none' : '$rounded20'}
          borderTopLeftRadius={poolId ? '$rounded20' : '$none'}
          borderTopRightRadius={poolId ? '$rounded20' : '$none'}
          $sm={{
            gap: '$gap8',
          }}
        >
          <D3LiquidityChartHeader
            price={price}
            isLoading={poolOrPairLoading}
            creatingPoolOrPair={creatingPoolOrPair}
            currencyControlOptions={currencyControlOptions}
            baseCurrency={baseCurrency}
            handleSelectToken={handleSelectToken}
          />
          {sortedLiquidityData && finalPriceData.entries.length > 0 && !showChartErrorView && !isLoading ? (
            <D3LiquidityRangeChart
              quoteCurrency={quoteCurrency}
              baseCurrency={baseCurrency}
              priceData={finalPriceData}
              liquidityData={sortedLiquidityData}
            />
          ) : (
            <Shine disabled={showChartErrorView} p="$spacing16">
              <ChartSkeleton
                errorText={
                  showChartErrorView && (
                    <Text variant="body3" color="$neutral2">
                      {t('position.setRange.inputsBelow')}
                    </Text>
                  )
                }
                chartTransform="translate(5, 0)"
                hidePriceIndicators
                height={CHART_DIMENSIONS.LIQUIDITY_CHART_TOTAL_HEIGHT}
                type={ChartType.PRICE}
              />
            </Shine>
          )}
          <LiquidityRangeActionButtons />
        </Flex>
        <D3LiquidityMinMaxInput />
      </LiquidityChartStoreProvider>
    </Flex>
  )
}
