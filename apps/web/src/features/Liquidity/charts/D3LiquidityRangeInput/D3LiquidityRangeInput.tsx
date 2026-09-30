import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, Price } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import type { SegmentedControlOption } from '@universe/mycelium/segmented-control-compat'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { PriceChartData } from '~/components/Charts/PriceChart'
import { ChartType } from '~/components/Charts/utils'
import { CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import {
  mayBorrowSiblingPriceLine,
  getChartDataState,
  getPriceLineSource,
  getPriceStrategiesState,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/chartDataState'
import { D3LiquidityChartHeader } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/D3LiquidityChartHeader'
import { D3LiquidityMinMaxInput } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/D3LiquidityMinMaxInput'
import { DefaultPriceStrategies } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/DefaultPriceStrategies'
import { LiquidityRangeActionButtons } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/LiquidityRangeActionButtons/LiquidityRangeActionButtons'
import { D3LiquidityRangeChart } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/D3LiquidityRangeChart'
import { LiquidityChartStoreProvider } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/LiquidityChartStoreProvider'
import { toDisplayCurrentPrice } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/toDisplayCurrentPrice'
import { useDensityChartData } from '~/features/Liquidity/charts/LiquidityRangeInput/hooks'
import { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'
import { useLiquidityServicePoolPriceChartData } from '~/features/Liquidity/charts/useLiquidityServicePoolPriceChartData'
import { MigratingPosition, RangeAmountInputPriceMode } from '~/features/Liquidity/Create/types'
import { useAllPoolTicks } from '~/features/Liquidity/hooks/usePoolTickData'
import { useSiblingPoolId } from '~/features/Liquidity/hooks/useSiblingPoolId'
import { TickData } from '~/features/Liquidity/types/ticks'
import { getBaseAndQuoteCurrencies } from '~/features/Liquidity/utils/currency'
import { useColor } from '~/hooks/useColor'

const MIN_DATA_POINTS = 1

// A pool with no liquidity has no distribution; stable identities so the chart's renderer effect
// doesn't re-run on every render.
const EMPTY_LIQUIDITY_DATA: ChartEntry[] = []
const EMPTY_TICK_DATA: TickData[] = []

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
  poolHasNoActiveLiquidity,
  isInitialPriceDirty,
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
  setMinMaxTick,
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
  /** An initialized pool with no distribution at the current tick. */
  poolHasNoActiveLiquidity?: boolean
  isInitialPriceDirty?: boolean
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
  setMinMaxTick: (ticks: { minTick?: number; maxTick?: number }) => void
  setIsFullRange: (isFullRange: boolean) => void
  handleSelectToken: (option: string) => void
}) {
  const { t } = useTranslation()
  const [internalChartError, setInternalChartError] = useState<string | undefined>(undefined)

  // TODO: consider moving this to the store - requires rearranging loading and error states
  const [selectedHistoryDuration, setSelectedHistoryDuration] = useState<HistoryDuration>(HistoryDuration.Month)

  const hooks = hook ?? ZERO_ADDRESS

  // Fetch liquidity data for the chart. Both fetches derive a pool id from the pair + fee when none is
  // given, so they'd otherwise query a pool that doesn't exist yet.
  const { formattedData: liquidityData, isLoading: liquidityDataLoading } = useDensityChartData({
    poolId,
    sdkCurrencies,
    priceInverted,
    version: protocolVersion,
    feeAmount: Number(feeTier),
    tickSpacing,
    hooks,
    skip: creatingPoolOrPair,
  })

  // Fetch raw tick data when feature flag is enabled
  // This bypasses the processing in useDensityChartData that loses some tick boundaries
  const { ticks: rawTicks, isLoading: rawTicksLoading } = useAllPoolTicks({
    sdkCurrencies,
    feeAmount: Number(feeTier),
    chainId: quoteCurrency.chainId as UniverseChainId,
    version: protocolVersion,
    tickSpacing,
    hooks,
    precalculatedPoolId: poolId,
    skip: creatingPoolOrPair,
  })

  // A pool that doesn't exist yet has no history or liquidity of its own, and one that is initialized
  // but holds no positions has never traded, so it has no history either. Borrow the price line from
  // the pair's deepest existing pool at another fee tier so there is still a chart to set the range
  // against; the liquidity side stays empty and every tick on the chart is this pool's.
  const mayBorrowSibling = mayBorrowSiblingPriceLine({ creatingPoolOrPair, poolHasNoActiveLiquidity })
  const { siblingPoolId, isLoading: siblingPoolLoading } = useSiblingPoolId({
    chainId: quoteCurrency.chainId,
    protocolVersion,
    sdkCurrencies,
    hook: hooks,
    excludePoolId: poolId,
    skip: !mayBorrowSibling,
  })

  const hasOwnPositions = Boolean(rawTicks?.length)
  const { priceHistoryPoolId, priceSourceLoading } = getPriceLineSource({
    creatingPoolOrPair,
    poolHasNoActiveLiquidity,
    poolId,
    siblingPoolId,
    siblingPoolLoading,
    hasOwnPositions,
    rawTicksLoading,
  })

  // Fetch price data for the chart
  const priceData = useLiquidityServicePoolPriceChartData({
    // Skipped while there is no pool to read: the pool is still loading, a new pool has no sibling, or
    // the borrowing decision hasn't settled.
    variables: {
      addressOrId: priceHistoryPoolId,
      chainId: quoteCurrency.chainId as UniverseChainId,
      duration: selectedHistoryDuration,
      isV4: protocolVersion === ProtocolVersion.V4,
      isV3: protocolVersion === ProtocolVersion.V3,
      isV2: false,
    },
    priceInverted,
  })

  // Re-orient a new pool's canonical initial price to the chart's display orientation so the appended
  // live-price point matches the (inverted) history entries instead of collapsing the range — see
  // toDisplayCurrentPrice.
  const displayCurrentPrice = toDisplayCurrentPrice({ currentPrice, priceInverted, creatingPoolOrPair })

  // Convert current price to PriceChartData point
  const currentPriceData: PriceChartData | undefined = useMemo(() => {
    if (!displayCurrentPrice) {
      return undefined
    }
    return {
      time: (new Date().getTime() / 1000) as UTCTimestamp,
      value: displayCurrentPrice,
      open: displayCurrentPrice,
      high: displayCurrentPrice,
      low: displayCurrentPrice,
      close: displayCurrentPrice,
    }
  }, [displayCurrentPrice])

  // Append current price to price data
  const finalPriceData = useMemo(() => {
    return {
      ...priceData,
      entries: [...priceData.entries, currentPriceData].filter(Boolean) as PriceChartData[],
    }
  }, [priceData, currentPriceData])

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

  const { showChartErrorView, isLoading } = getChartDataState({
    creatingPoolOrPair,
    poolHasNoActiveLiquidity,
    internalChartError,
    poolOrPairLoading,
    priceSourceLoading,
    priceQueryLoading: finalPriceData.loading,
    hasPriceData: finalPriceData.entries.length >= MIN_DATA_POINTS,
    // The fetched series without the appended live-price point.
    hasPriceHistory: priceData.entries.length >= MIN_DATA_POINTS,
    hasSiblingPool: Boolean(siblingPoolId),
    hasOwnPositions,
    liquidityDataLoading,
    rawTicksLoading,
    hasLiquidityData: Boolean(sortedLiquidityData && sortedLiquidityData.length >= MIN_DATA_POINTS),
  })

  const { showPriceStrategies, priceStrategiesLoading } = getPriceStrategiesState({
    creatingPoolOrPair,
    poolHasNoActiveLiquidity,
    showChartErrorView,
    poolOrPairLoading,
    chartLoading: isLoading,
  })

  // Ticks in the chart store and chart are in visual space: negated when priceInverted
  const visualCurrentTick = priceInverted ? -currentTick : currentTick

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
      ?.map((rawTick) => ({
        ...rawTick,
        tick: rawTick.tick !== undefined ? -rawTick.tick : undefined,
        liquidityNet: rawTick.liquidityNet ? String(-BigInt(rawTick.liquidityNet)) : rawTick.liquidityNet,
      }))
      .reverse()
  }, [rawTicks, priceInverted])

  // With no liquidity of its own the chart renders the borrowed price line over an empty distribution.
  // An empty pool can still have real ticks (positions parked outside the current tick), so only fall
  // back when there is nothing; a pool being created skips both fetches and always lands on the empties.
  const chartLiquidityData = mayBorrowSibling ? (sortedLiquidityData ?? EMPTY_LIQUIDITY_DATA) : sortedLiquidityData
  const chartTickData = mayBorrowSibling ? (finalTickData ?? EMPTY_TICK_DATA) : finalTickData

  return (
    <Flex id="d3-liquidity-range-input" gap="$gap4">
      <LiquidityChartStoreProvider
        tickSpacing={tickSpacing}
        currentTick={visualCurrentTick}
        currentPrice={displayCurrentPrice}
        creatingPoolOrPair={creatingPoolOrPair}
        isInitialPriceDirty={isInitialPriceDirty}
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
        onMinMaxTickChange={setMinMaxTick}
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
          {chartLiquidityData &&
          finalPriceData.entries.length > 0 &&
          chartTickData &&
          !showChartErrorView &&
          !isLoading ? (
            <D3LiquidityRangeChart
              quoteCurrency={sdkQuoteCurrency}
              baseCurrency={sdkBaseCurrency}
              priceData={finalPriceData}
              liquidityData={chartLiquidityData}
              migratingPosition={migratingPosition}
              tickSpacing={tickSpacing}
              currentTick={visualCurrentTick}
              rawTicks={chartTickData}
              protocolVersion={protocolVersion}
              token0Color={token0Color}
              token1Color={token1Color}
            />
          ) : (
            <ChartSkeleton
              hidePriceIndicators
              height={CHART_DIMENSIONS.LIQUIDITY_CHART_TOTAL_HEIGHT}
              type={ChartType.PRICE}
              errorText={
                showChartErrorView && (
                  <Text variant="body3" color="$neutral2">
                    {internalChartError || t('position.setRange.inputsBelow')}
                  </Text>
                )
              }
              p="$spacing16"
            />
          )}
          {!showChartErrorView && <LiquidityRangeActionButtons />}
        </Flex>
        {showPriceStrategies && <DefaultPriceStrategies isLoading={priceStrategiesLoading} />}
        <D3LiquidityMinMaxInput />
      </LiquidityChartStoreProvider>
    </Flex>
  )
}
