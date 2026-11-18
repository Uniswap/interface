import { ProtocolVersion as RestProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import { SegmentedControl } from '@universe/mycelium/segmented-control-compat'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useAtomValue } from 'jotai/utils'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v2TokenToCurrency } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { InterfaceEventName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { AdvancedPriceChartToggle } from '~/components/Charts/AdvancedPriceChartToggle'
import { refitChartContentAtom } from '~/components/Charts/ChartModel'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { getPillTimeSelectorOptions, ORDERED_TIMES } from '~/components/Charts/timeLabels'
import { VolumeChart } from '~/components/Charts/VolumeChart'
import type { PoolData } from '~/data/pools/poolData'
import { TimePeriod } from '~/data/util'
import { ChartTypeToggle } from '~/features/Explore/chart/ChartTypeToggle'
import { ZoomButtons } from '~/features/Liquidity/charts/D3LiquidityChartShared/components/ZoomButtons'
import { V2Reserves } from '~/features/Liquidity/utils/v2SyntheticTicks'
import {
  PDP_CHART_SELECTOR_OPTIONS,
  PDP_REVAMP_CHART_SELECTOR_OPTIONS,
  type PoolsDetailsChartType,
} from '~/pages/PoolDetails/components/ChartSection/chartTypeQueryState'
import {
  D3LiquidityPoolChart,
  D3LiquidityPoolChartZoomActions,
} from '~/pages/PoolDetails/components/ChartSection/D3LiquidityPoolChart'
import { DepthChart } from '~/pages/PoolDetails/components/ChartSection/DepthChart'
import {
  CandleIntervalSelector,
  GroupTicksToggle,
  PdpChartActionsContainer,
  PdpPriceChartActions,
} from '~/pages/PoolDetails/components/ChartSection/PdpChartControls'
import { PDP_CHART_HEIGHT_PX, PdpPriceChart } from '~/pages/PoolDetails/components/ChartSection/PdpPriceChart'
import { PdpRangeChart } from '~/pages/PoolDetails/components/ChartSection/PdpRangeChart'
import { usePdpCandles } from '~/pages/PoolDetails/components/ChartSection/usePdpCandles'
import { usePDPChartState } from '~/pages/PoolDetails/components/ChartSection/usePdpChartState'
import { usePriceChartZoom } from '~/pages/PoolDetails/components/ChartSection/usePriceChartZoom'
import { usePdpFlowActivity } from '~/pages/PoolDetails/components/LiquidityPanel/PdpFlowActivityContext'
import { ChartType, DataQuality } from '~/utils/charts'

interface ChartSectionProps {
  poolData?: PoolData
  loading: boolean
  isReversed: boolean
  chainId?: UniverseChainId
  tokenAColor: string
  tokenBColor: string
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

/**
 * Whether the Price tab shows the create flow's range chart in place of the price chart: while a deposit, or a
 * position's Edit range, sets the range. A v2 pair has no ticks for it to draw; its full-range deposit keeps the
 * price chart.
 */
function useShowRangeChart(protocolVersion: RestProtocolVersion | undefined): boolean {
  const isPdpRevampEnabled = useFeatureFlag(FeatureFlags.PdpRevamp)
  const isDepositFlowActive = usePdpFlowActivity()?.isActive === true
  return isPdpRevampEnabled && protocolVersion !== RestProtocolVersion.V2 && isDepositFlowActive
}

export function ChartSection(props: ChartSectionProps) {
  const media = useMedia()
  const { t } = useTranslation()
  const [zoomActions, setZoomActions] = useState<D3LiquidityPoolChartZoomActions | null>(null)
  // The deposit flow's range chart, while it's up in place of the price chart.
  const [rangeChartZoomActions, setRangeChartZoomActions] = useState<D3LiquidityPoolChartZoomActions>()
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

  const { setChartType, timePeriod, setTimePeriod, activeQuery, selectedChartType, priceEntries, volumeEntries } =
    usePDPChartState({
      poolData: props.poolData,
      isReversed: props.isReversed,
      chainId: props.chainId ?? UniverseChainId.Mainnet,
      protocolVersion: props.poolData?.protocolVersion ?? RestProtocolVersion.V3,
    })

  const refitChartContent = useAtomValue(refitChartContentAtom)
  const analyticsChainId = props.chainId
  const poolId = props.poolData?.idOrAddress
  const isPdpRevampEnabled = useFeatureFlag(FeatureFlags.PdpRevamp)
  const priceZoom = usePriceChartZoom({ isReversed: props.isReversed, timePeriod, poolId })
  const showPriceZoom = isPdpRevampEnabled && activeQuery.chartType === ChartType.PRICE
  const showRangeChart = useShowRangeChart(props.poolData?.protocolVersion)

  const showCandleControls = isPdpRevampEnabled && activeQuery.chartType === ChartType.PRICE && !showRangeChart
  const candleState = usePdpCandles({ priceEntries, enabled: showCandleControls })
  const { candles, interval: candleInterval } = candleState
  const showGroupTicksOnLiquidity = isPdpRevampEnabled && selectedChartType === ChartType.LIQUIDITY

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
        if (showRangeChart) {
          return (
            <PdpRangeChart
              priceQuery={activeQuery}
              tokenA={currencyA}
              tokenB={currencyB}
              isReversed={props.isReversed}
              onZoomActionsReady={setRangeChartZoomActions}
            />
          )
        }
        return (
          <PdpPriceChart
            {...selectedChartProps}
            data={candles ?? activeQuery.entries}
            priceSeries={activeQuery.entries}
            candleIntervalSeconds={candles && candleInterval?.seconds}
            stale={stale}
            overrideColor={props.isReversed ? props.tokenBColor : props.tokenAColor}
            zoomParams={priceZoom.chartParams}
            volumeData={isPdpRevampEnabled ? volumeEntries : undefined}
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
          availableOptions={isPdpRevampEnabled ? PDP_REVAMP_CHART_SELECTOR_OPTIONS : PDP_CHART_SELECTOR_OPTIONS}
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
        zoomActions || showGroupTicksOnLiquidity ? (
          <PdpChartActionsContainer>
            {showGroupTicksOnLiquidity && <GroupTicksToggle />}
            {zoomActions && (
              <Flex ml="auto" pl="$spacing12">
                <ZoomButtons
                  onZoomIn={zoomActions.zoomIn}
                  onZoomOut={zoomActions.zoomOut}
                  onReset={zoomActions.resetView}
                />
              </Flex>
            )}
          </PdpChartActionsContainer>
        ) : null
      ) : (
        <PdpPriceChartActions
          leading={
            showCandleControls ? (
              <AdvancedPriceChartToggle
                currentChartType={candleState.priceChartType}
                onChartTypeChange={candleState.setPriceChartType}
              />
            ) : undefined
          }
          periods={
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
          }
          trailing={
            showCandleControls && candles && candleInterval ? (
              <CandleIntervalSelector
                options={candleState.intervalOptions}
                selected={candleInterval}
                onSelect={candleState.setInterval}
              />
            ) : showRangeChart && activeQuery.chartType === ChartType.PRICE ? (
              <GroupTicksToggle />
            ) : undefined
          }
          zoom={
            showPriceZoom ? (
              rangeChartZoomActions ? (
                <ZoomButtons
                  onZoomIn={rangeChartZoomActions.zoomIn}
                  onZoomOut={rangeChartZoomActions.zoomOut}
                  onReset={rangeChartZoomActions.resetView}
                />
              ) : (
                <ZoomButtons onZoomIn={priceZoom.zoomIn} onZoomOut={priceZoom.zoomOut} onReset={priceZoom.fit} />
              )
            ) : undefined
          }
        />
      )}
    </Flex>
  )
}
