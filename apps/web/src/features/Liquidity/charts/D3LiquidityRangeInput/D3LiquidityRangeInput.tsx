import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, Price } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, SegmentedControlOption, Shine, Text } from 'ui/src'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { PriceChartData } from '~/components/Charts/PriceChart'
import { ChartType } from '~/components/Charts/utils'
import { CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import { D3LiquidityChartHeader } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/D3LiquidityChartHeader'
import { D3LiquidityMinMaxInput } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/D3LiquidityMinMaxInput'
import { DefaultPriceStrategies } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/DefaultPriceStrategies'
import { LiquidityRangeActionButtons } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/LiquidityRangeActionButtons/LiquidityRangeActionButtons'
import D3LiquidityRangeChart from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/D3LiquidityRangeChart'
import { LiquidityChartStoreProvider } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/LiquidityChartStoreProvider'
import { useDensityChartData } from '~/features/Liquidity/charts/LiquidityRangeInput/hooks'
import { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'
import { usePoolPriceChartData } from '~/features/Liquidity/charts/usePoolPriceChartData'
import { MigratingPosition, RangeAmountInputPriceMode } from '~/features/Liquidity/Create/types'
import { useAllPoolTicks } from '~/features/Liquidity/hooks/usePoolTickData'
import { getBaseAndQuoteCurrencies } from '~/features/Liquidity/utils/currency'
import { useColor } from '~/hooks/useColor'

const MIN_DATA_POINTS = 1

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
  migratingPosition,
  isFullRange,
  currentTick,
  minTick,
  maxTick,
  inputMode,
  setInputMode,
  setMinTick,
  setMaxTick,
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
  tickSpacing: number
  protocolVersion: ProtocolVersion
  hook?: string
  poolId?: string
  poolOrPairLoading?: boolean
  creatingPoolOrPair?: boolean
  price?: Price<Currency, Currency>
  currentPrice?: number
  isFullRange?: boolean
  currentTick: number
  minTick?: number
  maxTick?: number
  inputMode?: RangeAmountInputPriceMode
  migratingPosition?: MigratingPosition
  setInputMode: (inputMode: RangeAmountInputPriceMode) => void
  setMinTick: (tick?: number) => void
  setMaxTick: (tick?: number) => void
  setIsFullRange: (isFullRange: boolean) => void
  handleSelectToken: (option: string) => void
}) {
  const { t } = useTranslation()
  const chainInfo = getChainInfo(quoteCurrency.chainId)
  const [internalChartError, setInternalChartError] = useState<string | undefined>(undefined)

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

  // Fetch raw tick data when feature flag is enabled
  // This bypasses the processing in useDensityChartData that loses some tick boundaries
  const { ticks: rawTicks, isLoading: rawTicksLoading } = useAllPoolTicks({
    sdkCurrencies,
    feeAmount: Number(feeTier),
    chainId: quoteCurrency.chainId as UniverseChainId,
    version: protocolVersion,
    tickSpacing,
    hooks: hook ?? ZERO_ADDRESS,
    precalculatedPoolId: poolId,
  })

  const sortedLiquidityData = useMemo(() => {
    if (!liquidityData) {
      return undefined
    }
    const activeTick = Math.floor(currentTick / tickSpacing) * tickSpacing
    const uniqueTicksMap = new Map<number, ChartEntry>()
    let prevAmounts: Pick<ChartEntry, 'amount0Locked' | 'amount1Locked'> | undefined
    liquidityData.forEach((entry) => {
      // Negate ticks when priceInverted to match the visual tick scale
      const visualTick = priceInverted ? -entry.tick : entry.tick
      // When inverted, tick negation shifts locked amounts off by one position.
      // Use the previous canonical entry's amounts to realign with the visual tick range.
      // Skip the shift for the active tick so its partial amounts (both tokens) are preserved.
      uniqueTicksMap.set(visualTick, {
        ...entry,
        tick: visualTick,
        ...(priceInverted &&
          entry.tick !== activeTick && {
            amount0Locked: prevAmounts?.amount0Locked ?? 0,
            amount1Locked: prevAmounts?.amount1Locked ?? 0,
          }),
      })
      prevAmounts = entry
    })

    return Array.from(uniqueTicksMap.values()).sort((a, b) => a.price0 - b.price0)
  }, [liquidityData, priceInverted, currentTick, tickSpacing])

  // Error handling
  const showChartErrorView =
    !!internalChartError ||
    (!poolOrPairLoading && !finalPriceData.loading && finalPriceData.entries.length < MIN_DATA_POINTS) ||
    (!liquidityDataLoading && !sortedLiquidityData) ||
    (!liquidityDataLoading && sortedLiquidityData && sortedLiquidityData.length < MIN_DATA_POINTS)

  const isLoading = poolOrPairLoading || finalPriceData.loading || liquidityDataLoading || rawTicksLoading

  const { baseCurrency: sdkBaseCurrency, quoteCurrency: sdkQuoteCurrency } = getBaseAndQuoteCurrencies(
    sdkCurrencies,
    priceInverted,
  )

  // Token colors: token0Color for ticks above currentTick, token1Color for below
  // When priceInverted, the visual base/quote are swapped relative to SDK token0/token1
  const sdkToken0Color = useColor(sdkCurrencies.TOKEN0 ?? undefined)
  const sdkToken1Color = useColor(sdkCurrencies.TOKEN1 ?? undefined)
  const token0Color = priceInverted ? sdkToken1Color : sdkToken0Color
  const token1Color = priceInverted ? sdkToken0Color : sdkToken1Color

  const finalTickData = useMemo(() => {
    if (!priceInverted) {
      return rawTicks
    }
    // Negate ticks and liquidityNet, then reverse to restore ascending order.
    return rawTicks
      ?.map((rawTick) =>
        rawTick
          ? {
              ...rawTick,
              tick: rawTick.tick !== undefined ? -rawTick.tick : undefined,
              liquidityNet: rawTick.liquidityNet ? String(-BigInt(rawTick.liquidityNet)) : rawTick.liquidityNet,
            }
          : rawTick,
      )
      .reverse()
  }, [rawTicks, priceInverted])

  return (
    <Flex id="d3-liquidity-range-input" gap="$gap4">
      <LiquidityChartStoreProvider
        tickSpacing={tickSpacing}
        baseCurrency={sdkBaseCurrency}
        quoteCurrency={sdkQuoteCurrency}
        priceInverted={priceInverted}
        protocolVersion={protocolVersion}
        selectedHistoryDuration={selectedHistoryDuration}
        minTick={minTick}
        maxTick={maxTick}
        isFullRange={isFullRange}
        inputMode={inputMode}
        onChartError={setInternalChartError}
        onInputModeChange={setInputMode}
        onMinTickChange={setMinTick}
        onMaxTickChange={setMaxTick}
        onTimePeriodChange={setSelectedHistoryDuration}
        setIsFullRange={setIsFullRange}
      >
        <Flex
          backgroundColor="$surface2"
          gap="$gap16"
          borderTopLeftRadius="$rounded20"
          borderTopRightRadius="$rounded20"
          $sm={{
            gap: '$gap8',
          }}
        >
          {!creatingPoolOrPair && (
            <D3LiquidityChartHeader
              price={price}
              isLoading={poolOrPairLoading}
              creatingPoolOrPair={creatingPoolOrPair}
              currencyControlOptions={currencyControlOptions}
              baseCurrency={baseCurrency}
              handleSelectToken={handleSelectToken}
            />
          )}
          {sortedLiquidityData &&
          finalPriceData.entries.length > 0 &&
          finalTickData &&
          !showChartErrorView &&
          !isLoading ? (
            <D3LiquidityRangeChart
              quoteCurrency={sdkQuoteCurrency}
              baseCurrency={sdkBaseCurrency}
              priceData={finalPriceData}
              liquidityData={sortedLiquidityData}
              migratingPosition={migratingPosition}
              tickSpacing={tickSpacing}
              currentTick={priceInverted ? -currentTick : currentTick}
              rawTicks={finalTickData}
              protocolVersion={protocolVersion}
              token0Color={token0Color}
              token1Color={token1Color}
            />
          ) : (
            <Shine disabled={showChartErrorView} p="$spacing16">
              <ChartSkeleton
                errorText={
                  showChartErrorView && (
                    <Text variant="body3" color="$neutral2">
                      {internalChartError || t('position.setRange.inputsBelow')}
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
          {!showChartErrorView && <LiquidityRangeActionButtons />}
        </Flex>
        {!showChartErrorView && !creatingPoolOrPair && <DefaultPriceStrategies isLoading={isLoading} />}
        <D3LiquidityMinMaxInput />
      </LiquidityChartStoreProvider>
    </Flex>
  )
}
