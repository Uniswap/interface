import { ProtocolVersion as RestProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { NativeCurrency, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import { SegmentedControl } from '@universe/mycelium/segmented-control-compat'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useAtomValue } from 'jotai/utils'
import { createParser, useQueryState } from 'nuqs'
import { type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getLowVarianceAxisDecimals } from 'uniswap/src/components/charts/utils'
import { v2TokenToCurrency } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { InterfaceEventName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'
import { ChartHeader } from '~/components/Charts/ChartHeader'
import { Chart, refitChartContentAtom } from '~/components/Charts/ChartModel'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { PriceChartData, PriceChartModel } from '~/components/Charts/PriceChart'
import { PriceChartDelta } from '~/components/Charts/PriceChart/PriceChartDelta'
import { getCandlestickPriceBounds } from '~/components/Charts/PriceChart/utils'
import { ChartQueryResult, ChartType, DataQuality, PriceChartType } from '~/components/Charts/utils'
import { VolumeChart } from '~/components/Charts/VolumeChart'
import { SingleHistogramData } from '~/components/Charts/VolumeChart/utils'
import type { PoolData } from '~/data/pools/poolData'
import { TimePeriod, toHistoryDuration } from '~/data/util'
import { ChartActionsContainer } from '~/features/Explore/chart/ChartActionsContainer'
import { ChartTypeToggle } from '~/features/Explore/chart/ChartTypeToggle'
import { getPillTimeSelectorOptions, ORDERED_TIMES } from '~/features/Explore/timeLabels'
import { ZoomButtons } from '~/features/Liquidity/charts/D3LiquidityChartShared/components/ZoomButtons'
import { useLiquidityServicePoolPriceChartData } from '~/features/Liquidity/charts/useLiquidityServicePoolPriceChartData'
import { useLiquidityServicePoolVolumeChartData } from '~/features/Liquidity/charts/useLiquidityServicePoolVolumeChartData'
import { useLiquidityServiceGetPool } from '~/features/Liquidity/hooks/useLiquidityServiceGetPool'
import { getTickToPrice, getV4TickToPrice } from '~/features/Liquidity/utils/getTickToPrice'
import { V2Reserves } from '~/features/Liquidity/utils/v2SyntheticTicks'
import { tryParseCurrencyAmount } from '~/lib/utils/tryParseCurrencyAmount'
import { ChartPriceText, PriceDisplayContainer } from '~/pages/PoolDetails/components/ChartSection/ChartPriceDisplay'
import {
  D3LiquidityPoolChart,
  D3LiquidityPoolChartZoomActions,
} from '~/pages/PoolDetails/components/ChartSection/D3LiquidityPoolChart'
import { DepthChart } from '~/pages/PoolDetails/components/ChartSection/DepthChart'
import { formatPriceWithSubscript } from '~/pages/PoolDetails/components/formatPriceWithSubscript'
import { unwrappedToken } from '~/utils/unwrappedToken'

const PDP_CHART_HEIGHT_PX = 356
// Pool prices routinely run to 1e-6 and below, so keep enough significant digits to survive `Number()`.
const SPOT_PRICE_SIGNIFICANT_DIGITS = 12
const PDP_CHART_SELECTOR_OPTIONS = [ChartType.VOLUME, ChartType.PRICE, ChartType.LIQUIDITY, ChartType.DEPTH] as const

export type PoolsDetailsChartType = (typeof PDP_CHART_SELECTOR_OPTIONS)[number]

const CHART_URL_VALUE_TO_TYPE: Record<string, PoolsDetailsChartType> = {
  volume: ChartType.VOLUME,
  price: ChartType.PRICE,
  liquidity: ChartType.LIQUIDITY,
  depth: ChartType.DEPTH,
}
const CHART_TYPE_TO_URL_VALUE: Record<PoolsDetailsChartType, string> = {
  [ChartType.VOLUME]: 'volume',
  [ChartType.PRICE]: 'price',
  [ChartType.LIQUIDITY]: 'liquidity',
  [ChartType.DEPTH]: 'depth',
}
const parseAsPDPChartType = createParser({
  parse: (query: string) => CHART_URL_VALUE_TO_TYPE[query.toLowerCase()] ?? null,
  serialize: (value: PoolsDetailsChartType) => CHART_TYPE_TO_URL_VALUE[value],
})
  .withDefault(ChartType.VOLUME)
  .withOptions({ clearOnDefault: true })
interface ChartSectionProps {
  poolData?: PoolData
  loading: boolean
  isReversed: boolean
  chainId?: UniverseChainId
  tokenAColor: string
  tokenBColor: string
}

/** Represents a variety of query result shapes, discriminated via additional `chartType` field. */
type ActiveQuery =
  | ChartQueryResult<PriceChartData, ChartType.PRICE>
  | ChartQueryResult<SingleHistogramData, ChartType.VOLUME>
  | ChartQueryResult<undefined, ChartType.LIQUIDITY>

type TDPChartState = {
  timePeriod: TimePeriod
  setTimePeriod: (timePeriod: TimePeriod) => void
  setChartType: (chartType: PoolsDetailsChartType) => void
  selectedChartType: PoolsDetailsChartType
  activeQuery: ActiveQuery
  dataQuality?: DataQuality
  priceEntries?: PriceChartData[]
}

/**
 * Live spot price from the pool's active tick, oriented to match the chart's `priceInverted`
 * display so it lands in the same units as the price-history entries.
 *
 * Reads the same liquidity-service `GetPool` row the liquidity and depth tabs already load for this
 * pool (keyed on `{chainId, poolId}`), so the request is shared with them rather than being a new
 * data source.
 */
function usePoolSpotPrice({
  poolData,
  isReversed,
  chainId,
  version,
  enabled,
}: {
  poolData: PoolData | undefined
  isReversed: boolean
  chainId: UniverseChainId
  version: RestProtocolVersion
  enabled: boolean
}): number | undefined {
  const poolId = poolData?.idOrAddress
  const { data } = useLiquidityServiceGetPool({ chainId, poolId, enabled })
  const pool = data?.pool

  return useMemo(() => {
    // `sqrtPriceX96` is only set on an initialized pool; pair it with `currentTick` (proto3-optional,
    // absent on an uninitialized row) so a real tick 0 (price 1) reads differently from "no tick".
    if (!pool?.sqrtPriceX96 || pool.currentTick === undefined || !poolData) {
      return undefined
    }
    const currency0 = v2TokenToCurrency(poolData.token0)
    const currency1 = v2TokenToCurrency(poolData.token1)
    const [base, quote] = isReversed ? [currency1, currency0] : [currency0, currency1]

    const price =
      version === RestProtocolVersion.V4
        ? getV4TickToPrice({ baseCurrency: base, quoteCurrency: quote, tick: pool.currentTick })
        : getTickToPrice({ baseToken: base?.wrapped, quoteToken: quote?.wrapped, tick: pool.currentTick })

    return price ? Number(price.toSignificant(SPOT_PRICE_SIGNIFICANT_DIGITS)) : undefined
  }, [pool?.sqrtPriceX96, pool?.currentTick, poolData, isReversed, version])
}

function usePDPChartState({
  poolData,
  isReversed,
  chainId,
  protocolVersion,
}: {
  poolData: PoolData | undefined
  isReversed: boolean
  chainId: UniverseChainId
  protocolVersion: RestProtocolVersion
}): TDPChartState {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.DAY)
  const [selectedChartType, setChartType] = useQueryState('chart', parseAsPDPChartType)

  const isV2 = protocolVersion === RestProtocolVersion.V2

  // DEPTH is a different visualization of the same data as LIQUIDITY — share data fetching.
  const chartType = selectedChartType === ChartType.DEPTH ? ChartType.LIQUIDITY : selectedChartType
  const isV3 = protocolVersion === RestProtocolVersion.V3
  const isV4 = protocolVersion === RestProtocolVersion.V4
  const variables = {
    addressOrId: poolData?.idOrAddress ?? '',
    chainId,
    duration: toHistoryDuration(timePeriod),
    isV4,
    isV3,
    isV2,
  }

  const currentPrice = usePoolSpotPrice({
    poolData,
    isReversed,
    chainId,
    version: protocolVersion,
    enabled: chartType === ChartType.PRICE,
  })

  const priceQuery = useLiquidityServicePoolPriceChartData({ variables, priceInverted: isReversed, currentPrice })
  const volumeQuery = useLiquidityServicePoolVolumeChartData({ variables })

  return useMemo(() => {
    const activeQuery =
      chartType === ChartType.PRICE
        ? priceQuery
        : chartType === ChartType.VOLUME
          ? volumeQuery
          : {
              chartType: ChartType.LIQUIDITY as const,
              entries: [],
              loading: false,
              dataQuality: DataQuality.VALID,
            }

    return {
      timePeriod,
      setTimePeriod,
      setChartType,
      selectedChartType,
      activeQuery,
      priceEntries: priceQuery.entries,
    }
  }, [chartType, selectedChartType, volumeQuery, priceQuery, timePeriod, setChartType])
}

/**
 * v2 has no ticks on chain; its liquidity and depth charts are derived from the pair's reserves,
 * which `PoolData` already carries as the per-token TVL (decimal-adjusted).
 */
function useV2Reserves(poolData?: PoolData): V2Reserves | undefined {
  const isV2 = poolData?.protocolVersion === RestProtocolVersion.V2
  const reserve0 = poolData?.tvlToken0
  const reserve1 = poolData?.tvlToken1
  // Memoized on the raw numbers: the whole synthetic tick set is rebuilt whenever this changes
  // identity, and it feeds a react-query key downstream.
  return useMemo(
    () => (isV2 && reserve0 !== undefined && reserve1 !== undefined ? { reserve0, reserve1 } : undefined),
    [isV2, reserve0, reserve1],
  )
}

// The shared container reverses its row so a lone control sits right; the PDP revamp wants it left.
function PdpChartActionsContainer({ children }: { children: ReactNode }): JSX.Element {
  const isPdpRevampEnabled = useFeatureFlag(FeatureFlags.PdpRevamp)
  return isPdpRevampEnabled ? (
    <Flex row alignItems="center" mt="$spacing12" width="100%">
      {children}
    </Flex>
  ) : (
    <ChartActionsContainer>{children}</ChartActionsContainer>
  )
}

export function ChartSection(props: ChartSectionProps) {
  const media = useMedia()
  const { t } = useTranslation()
  const [zoomActions, setZoomActions] = useState<D3LiquidityPoolChartZoomActions | null>(null)
  const v2Reserves = useV2Reserves(props.poolData)

  // Memoized: these flow into the chart hooks' dependency arrays, and `v2TokenToCurrency` mints a
  // fresh Token every call, which would rebuild the whole tick distribution on every render.
  const currencyA = useMemo(
    () => props.poolData?.token0 && v2TokenToCurrency(props.poolData.token0),
    [props.poolData?.token0],
  )
  const currencyB = useMemo(
    () => props.poolData?.token1 && v2TokenToCurrency(props.poolData.token1),
    [props.poolData?.token1],
  )

  const { setChartType, timePeriod, setTimePeriod, activeQuery, selectedChartType, priceEntries } = usePDPChartState({
    poolData: props.poolData,
    isReversed: props.isReversed,
    chainId: props.chainId ?? UniverseChainId.Mainnet,
    protocolVersion: props.poolData?.protocolVersion ?? RestProtocolVersion.V3,
  })

  const refitChartContent = useAtomValue(refitChartContentAtom)
  const analyticsChainId = props.chainId
  const poolId = props.poolData?.idOrAddress

  // TODO(WEB-3740): Integrate BE tick query, remove special casing for liquidity chart
  const loading = props.loading || (activeQuery.chartType !== ChartType.LIQUIDITY ? activeQuery.loading : false)

  // oxlint-disable-next-line typescript/consistent-return
  const ChartBody = (() => {
    if (!currencyA || !currencyB || !props.poolData || !props.chainId) {
      return <ChartSkeleton type={activeQuery.chartType} height={PDP_CHART_HEIGHT_PX} />
    }

    const selectedChartProps = {
      ...props,
      feeTier: Number(props.poolData.feeTier?.feeAmount),
      height: PDP_CHART_HEIGHT_PX,
      timePeriod,
      tokenA: currencyA,
      tokenB: currencyB,
      tokenAColor: props.tokenAColor,
      tokenBColor: props.tokenBColor,
      chainId: props.chainId,
      poolId: props.poolData.idOrAddress,
      hooks: props.poolData.hookAddress,
      version: props.poolData.protocolVersion ?? RestProtocolVersion.V3,
      v2Reserves,
    }

    // TODO(WEB-3740): Integrate BE tick query, remove special casing for liquidity chart
    if (activeQuery.chartType === ChartType.LIQUIDITY) {
      if (selectedChartType === ChartType.DEPTH) {
        return <DepthChart {...selectedChartProps} onZoomActionsReady={setZoomActions} priceEntries={priceEntries} />
      }
      return <D3LiquidityPoolChart {...selectedChartProps} onZoomActionsReady={setZoomActions} />
    }
    if (activeQuery.dataQuality === DataQuality.INVALID) {
      const errorText = loading ? undefined : t('chart.error.pools')
      return <ChartSkeleton type={activeQuery.chartType} height={PDP_CHART_HEIGHT_PX} errorText={errorText} />
    }

    const stale = activeQuery.dataQuality === DataQuality.STALE

    switch (activeQuery.chartType) {
      case ChartType.PRICE:
        return (
          <PriceChart
            {...selectedChartProps}
            data={activeQuery.entries}
            stale={stale}
            overrideColor={props.isReversed ? props.tokenBColor : props.tokenAColor}
          />
        )
      case ChartType.VOLUME:
        return <VolumeChart {...selectedChartProps} data={activeQuery.entries} stale={stale} />
    }
  })()

  // BE does not support hourly price data for pools
  const filteredTimeOptions = useMemo(() => {
    if (activeQuery.chartType === ChartType.PRICE) {
      if (timePeriod === TimePeriod.HOUR) {
        setTimePeriod(TimePeriod.DAY)
      }
      return {
        options: getPillTimeSelectorOptions(
          t,
          ORDERED_TIMES.filter((period) => period !== TimePeriod.HOUR),
        ),
        selected: timePeriod,
      }
    }
    return {
      options: getPillTimeSelectorOptions(t),
      selected: timePeriod,
    }
  }, [activeQuery.chartType, timePeriod, setTimePeriod, t])

  return (
    <Flex testID="pdp-chart-container">
      <Flex height="$spacing48" justifyContent="center" mb="$spacing24">
        <ChartTypeToggle
          variant="text"
          availableOptions={PDP_CHART_SELECTOR_OPTIONS}
          currentChartType={selectedChartType}
          onChartTypeChange={(c: ChartType) => {
            if (c !== selectedChartType) {
              sendAnalyticsEvent(InterfaceEventName.ChartSettingSelected, {
                page: InterfacePageName.PoolDetailsPage,
                selection: 'chart_type',
                chart_type: c,
                time_period: timePeriod,
                previous_value: selectedChartType,
                chain_id: analyticsChainId,
                pool_id: poolId,
              })
            }
            if (c !== ChartType.LIQUIDITY) {
              setZoomActions(null)
            }
            setChartType(c as PoolsDetailsChartType)
          }}
        />
      </Flex>
      {ChartBody}
      {activeQuery.chartType === ChartType.LIQUIDITY ? (
        zoomActions ? (
          <PdpChartActionsContainer>
            <ZoomButtons
              onZoomIn={zoomActions.zoomIn}
              onZoomOut={zoomActions.zoomOut}
              onReset={zoomActions.resetView}
            />
          </PdpChartActionsContainer>
        ) : null
      ) : (
        <PdpChartActionsContainer>
          <Flex $md={{ width: '100%' }}>
            <SegmentedControl
              fullWidth={media.md}
              options={filteredTimeOptions.options}
              selectedOption={filteredTimeOptions.selected}
              onSelectOption={(option: TimePeriod) => {
                if (option === timePeriod) {
                  refitChartContent?.()
                } else {
                  sendAnalyticsEvent(InterfaceEventName.ChartSettingSelected, {
                    page: InterfacePageName.PoolDetailsPage,
                    selection: 'time_period',
                    chart_type: selectedChartType,
                    time_period: option,
                    previous_value: timePeriod,
                    chain_id: analyticsChainId,
                    pool_id: poolId,
                  })
                  setTimePeriod(option)
                }
              }}
            />
          </Flex>
        </PdpChartActionsContainer>
      )}
    </Flex>
  )
}

function PriceChart({
  tokenA,
  tokenB,
  isReversed,
  data,
  stale,
  overrideColor,
}: {
  tokenA: Token | NativeCurrency
  tokenB: Token | NativeCurrency
  isReversed: boolean
  data: PriceChartData[]
  stale: boolean
  overrideColor?: string
}) {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const locale = useCurrentLocale()
  const [baseCurrency, quoteCurrency] = isReversed ? [tokenB, tokenA] : [tokenA, tokenB]
  const baseSymbol = unwrappedToken(baseCurrency).symbol ?? baseCurrency.symbol
  const quoteSymbol = unwrappedToken(quoteCurrency).symbol ?? quoteCurrency.symbol

  // Stablecoin pools sit in a price range too tight for the magnitude-based formatter to resolve,
  // so derive the precision from the visible range to keep gridlines (and the header) distinct.
  const axisFractionDigits = useMemo(() => {
    const { min, max } = getCandlestickPriceBounds(data)
    return getLowVarianceAxisDecimals(min, max)
  }, [data])

  const yAxisFormatter = useMemo(
    () => (price: number) =>
      formatPriceWithSubscript({ price, locale, formatNumberOrString, fractionDigits: axisFractionDigits }),
    [locale, formatNumberOrString, axisFractionDigits],
  )

  const params = useMemo(
    () => ({ data, stale, type: PriceChartType.LINE, yAxisFormatter }),
    [data, stale, yAxisFormatter],
  )

  const lastPrice = data[data.length - 1]
  const price = useUSDCValue(tryParseCurrencyAmount(lastPrice.value.toString(), quoteCurrency))
  return (
    <Chart
      height={PDP_CHART_HEIGHT_PX}
      Model={PriceChartModel}
      params={params}
      showDottedBackground
      showLeftFadeOverlay
      overrideColor={overrideColor}
    >
      {(crosshairData) => {
        const displayValue = crosshairData ?? lastPrice
        // `useLiquidityServicePoolPriceChartData` emits flat entries — `buildFlatEntry` sets `value`
        // and every OHLC field to the same price — so reading `close` here is equivalent to `value`.
        const priceDisplay = (
          <PriceDisplayContainer>
            <ChartPriceText>
              {`1 ${baseSymbol} = ${formatPriceWithSubscript({
                price: displayValue.close,
                locale,
                formatNumberOrString,
                fractionDigits: axisFractionDigits,
              })} ${quoteSymbol}`}
            </ChartPriceText>
            <ChartPriceText color="$neutral2">
              {/* the usd price is only calculated for the most recent data point so hide it when selecting a crosshair */}
              {price && !crosshairData
                ? '(' + convertFiatAmountFormatted(price.toSignificant(), NumberType.FiatTokenPrice) + ')'
                : ''}
            </ChartPriceText>
            <PriceChartDelta startingPrice={data[0].close} endingPrice={displayValue.close} />
          </PriceDisplayContainer>
        )
        return (
          <ChartHeader value={priceDisplay} valueFormatterType={NumberType.FiatTokenPrice} time={crosshairData?.time} />
        )
      }}
    </Chart>
  )
}
