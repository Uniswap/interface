import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import type { UniverseChainId } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { useEvent } from 'utilities/src/react/hooks'
import { hashKey } from 'utilities/src/reactQuery/hashKey'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { calculateRangeViewport } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/viewportUtils'
import { D3LiquidityRangeChart } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/D3LiquidityRangeChart'
import { LiquidityChartStoreContext } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/LiquidityChartStoreContext'
import { LiquidityChartStoreProvider } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/LiquidityChartStoreProvider'
import { useChartPriceState } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/priceSelectors'
import { useLiquidityChartStoreActions } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/useLiquidityChartStore'
import {
  useRangeChartLiquidity,
  useRangeChartTokenColors,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/useRangeChartLiquidity'
import { useCreateLiquidityContext } from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import { RangeAmountInputPriceMode, type TickRange } from '~/features/Liquidity/Create/types'
import { getBaseAndQuoteCurrencies } from '~/features/Liquidity/utils/currency'
import { toDisplayTick, toDisplayTickRange } from '~/features/Liquidity/utils/displayTicks'
import type { D3LiquidityPoolChartZoomActions } from '~/pages/PoolDetails/components/ChartSection/D3LiquidityPoolChart'
import { usePdpChartDisplayStore } from '~/pages/PoolDetails/components/ChartSection/pdpChartDisplayStore'
import { PdpPriceChartHeader } from '~/pages/PoolDetails/components/ChartSection/PdpPriceChartHeader'
import { usePdpChartRangePreview } from '~/pages/PoolDetails/components/LiquidityPanel/PdpChartRangeContext'
import { isPriceRangeSet } from '~/pages/PoolDetails/components/LiquidityPanel/rangeEditor'
import { type ChartQueryResult, ChartType } from '~/utils/charts'

const PDP_CHART_HEIGHT_PX = 356

function noop(): void {}

/**
 * Hands the chart's zoom to the section's buttons while it's up, and the store's live ticks to the panel as
 * a preview: a handle drag moves the store with the pointer and reaches the flow on release. A range set
 * from outside the chart (a panel preset, a typed edge, a stepper) recentres the view on it.
 */
function PdpRangeChartBridge({
  committedRange,
  fullRange,
  onZoomActionsReady,
}: {
  committedRange: TickRange | undefined
  fullRange: boolean
  onZoomActionsReady?: (actions: D3LiquidityPoolChartZoomActions | undefined) => void
}): null {
  const store = useContext(LiquidityChartStoreContext)
  const { zoomIn, zoomOut, centerRange, animateToState } = useLiquidityChartStoreActions()
  const { minTick, maxTick } = useChartPriceState()
  const setPreview = usePdpChartRangePreview()

  useEffect(() => {
    onZoomActionsReady?.({ zoomIn, zoomOut, resetView: centerRange })
    return () => onZoomActionsReady?.(undefined)
  }, [zoomIn, zoomOut, centerRange, onZoomActionsReady])

  // The store takes a newly committed range in its provider's effect, which runs after this one's, so here it
  // still holds the range it had: the chart's own drags and echoes already put the new range there, anything
  // else came from outside. Only the view moves (no ticks, no emit), so a followed preset keeps following.
  // Entering or leaving full range is left to the store's own reset.
  useEffect(() => {
    const state = store?.getState()
    if (!state?.renderingContext || !committedRange || fullRange || state.isFullRange) {
      return
    }
    if (state.minTick === committedRange.minTick && state.maxTick === committedRange.maxTick) {
      return
    }
    const { targetZoom, targetPanY } = calculateRangeViewport({
      ...committedRange,
      tickSpacing: state.renderingContext.tickSpacing,
    })
    animateToState({ targetZoom, targetPan: targetPanY })
  }, [committedRange, fullRange, store, animateToState])

  // For that same render the store's range is the one committed before: that's no preview either.
  const previousCommittedRef = useRef(committedRange)
  useEffect(() => {
    previousCommittedRef.current = committedRange
  }, [committedRange])

  // A full range pins the store's ticks to the distribution's ends, which the flow reads as open.
  const preview = useMemo((): TickRange | undefined => {
    if (fullRange || minTick === undefined || maxTick === undefined) {
      return undefined
    }
    const isCommitted = [committedRange, previousCommittedRef.current].some(
      (range) => range && minTick === range.minTick && maxTick === range.maxTick,
    )
    return isCommitted ? undefined : { minTick, maxTick }
  }, [fullRange, minTick, maxTick, committedRange])
  useEffect(() => {
    setPreview(preview)
  }, [preview, setPreview])
  useEffect(() => () => setPreview(undefined), [setPreview])

  return null
}

/**
 * The Add Liquidity flow's range chart on the pool page while a deposit is under way: the pool's price line
 * with its liquidity along the right and the range's handles beside it, driving the deposit flow's range as
 * the create page's does. The price data is the page's own, for the period picked under the chart.
 */
export function PdpRangeChart({
  priceQuery,
  tokenA,
  tokenB,
  isReversed,
  onZoomActionsReady,
}: {
  priceQuery: ChartQueryResult<PriceChartData, ChartType.PRICE>
  tokenA: Currency
  tokenB: Currency
  isReversed: boolean
  onZoomActionsReady?: (actions: D3LiquidityPoolChartZoomActions | undefined) => void
}): JSX.Element {
  const { t } = useTranslation()
  const {
    currencies,
    priceRangeState,
    setPriceRangeState,
    ticks,
    protocolVersion,
    price,
    poolId,
    poolOrPair,
    poolOrPairLoading,
    positionState,
  } = useCreateLiquidityContext()
  const { priceInverted, fullRange } = priceRangeState
  const pool = poolOrPair && 'tickCurrent' in poolOrPair ? poolOrPair : undefined
  const tickSpacing = pool?.tickSpacing
  const canonicalTick = pool?.tickCurrent
  const {
    rawTicks,
    liquidityData,
    rawTicksLoading,
    liquidityDataLoading,
    error: dataError,
  } = useRangeChartLiquidity({
    poolId,
    sdkCurrencies: currencies.sdk,
    feeAmount: positionState.fee?.feeAmount,
    chainId: currencies.sdk.TOKEN0?.chainId as UniverseChainId,
    version: protocolVersion,
    tickSpacing,
    hook: positionState.hook,
    priceInverted,
    currentTick: canonicalTick,
    skip: protocolVersion === ProtocolVersion.V2,
  })
  const isLoading = Boolean(poolOrPairLoading) || rawTicksLoading || liquidityDataLoading
  const data =
    rawTicks && liquidityData && tickSpacing !== undefined && canonicalTick !== undefined
      ? { rawTicks, liquidityData, tickSpacing, currentTick: toDisplayTick(canonicalTick, priceInverted) }
      : undefined
  const [chartError, setChartError] = useState<string>()
  // Until the default range is seeded the flow's ticks fall back to the extremes, which the chart would
  // take as the range to fit.
  const isSeeded = isPriceRangeSet(priceRangeState)

  // The flow's live ticks in display space, as the editor reads them, so a followed preset moves with the price.
  const [tickLower, tickUpper] = ticks
  const committedRange = useMemo(
    (): TickRange | undefined =>
      typeof tickLower === 'number' && typeof tickUpper === 'number'
        ? toDisplayTickRange({ tickLower, tickUpper }, priceInverted)
        : undefined,
    [tickLower, tickUpper, priceInverted],
  )

  const groupTicks = usePdpChartDisplayStore((state) => state.groupTicks)

  const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(currencies.sdk, priceInverted)
  const { token0Color, token1Color } = useRangeChartTokenColors(currencies.sdk, priceInverted)

  // The flow's price is already in display orientation; the handles' % chips measure from it.
  const currentPrice = price ? Number(price.toSignificant()) : undefined
  // The page's query already ends on the live spot price, which refreshes on its own. The chart resets its
  // view (and re-emits its range) whenever the hash changes, so the hash leaves that last point out.
  const priceData = useMemo(() => ({ ...priceQuery, dataHash: hashKey(priceQuery.entries.slice(0, -1)) }), [priceQuery])

  // The store keeps the callbacks it was created with, so these stay stable and read the latest render
  // (the error setter is a state setter, already stable).
  // The chart hands back the range it settles on after a reset or a preset's animation, which may be the one
  // it was given: that mustn't turn a followed preset into a custom range.
  const setRange = useEvent((next: { minTick?: number; maxTick?: number }) => {
    const minTick = next.minTick ?? committedRange?.minTick
    const maxTick = next.maxTick ?? committedRange?.maxTick
    if (minTick === committedRange?.minTick && maxTick === committedRange?.maxTick) {
      return
    }
    setPriceRangeState((prev) => ({ ...prev, fullRange: false, minTick, maxTick, followedPreset: undefined }))
  })
  const setMinTick = useEvent((minTick?: number) => setRange({ minTick }))
  const setMaxTick = useEvent((maxTick?: number) => setRange({ maxTick }))
  const setFullRange = useEvent((isFullRange: boolean) => {
    setPriceRangeState((prev) =>
      prev.fullRange === isFullRange ? prev : { ...prev, fullRange: isFullRange, followedPreset: undefined },
    )
  })

  const isReady = isSeeded && data !== undefined && priceData.entries.length > 0 && !chartError
  const hasNoData = data === undefined && (Boolean(dataError) || !isLoading)
  // ChartSection already shows its own error for too little price data; this covers an empty period regardless.
  const hasNoPrices = !priceQuery.loading && priceQuery.entries.length === 0
  const errorText =
    chartError ?? (hasNoPrices ? t('chart.error.pools') : hasNoData ? t('pool.liquidity.error') : undefined)
  return (
    <Flex height={PDP_CHART_HEIGHT_PX} position="relative">
      <PdpPriceChartHeader tokenA={tokenA} tokenB={tokenB} isReversed={isReversed} data={priceQuery.entries} />
      {isReady ? (
        // The chart measures itself by this id, as on the create page.
        <Flex id="d3-liquidity-range-input" flex={1} justifyContent="center">
          <LiquidityChartStoreProvider
            // The store fixes the orientation and its currencies when it's created, so a flip starts a new one.
            key={String(priceInverted)}
            tickSpacing={data.tickSpacing}
            currentTick={data.currentTick}
            currentPrice={currentPrice}
            baseCurrency={baseCurrency}
            quoteCurrency={quoteCurrency}
            priceInverted={priceInverted}
            protocolVersion={protocolVersion}
            // Only the chart's own period buttons read it, and the page's period row stands in for those.
            selectedHistoryDuration={HistoryDuration.Month}
            minTick={committedRange?.minTick}
            maxTick={committedRange?.maxTick}
            isFullRange={fullRange}
            inputMode={RangeAmountInputPriceMode.PERCENTAGE}
            onChartError={setChartError}
            onInputModeChange={noop}
            onMinTickChange={setMinTick}
            onMaxTickChange={setMaxTick}
            onMinMaxTickChange={setRange}
            setIsFullRange={setFullRange}
          >
            <PdpRangeChartBridge
              committedRange={committedRange}
              fullRange={fullRange}
              onZoomActionsReady={onZoomActionsReady}
            />
            <D3LiquidityRangeChart
              priceData={priceData}
              liquidityData={data.liquidityData}
              rawTicks={data.rawTicks}
              quoteCurrency={quoteCurrency}
              baseCurrency={baseCurrency}
              currentTick={data.currentTick}
              tickSpacing={data.tickSpacing}
              protocolVersion={protocolVersion}
              token0Color={token0Color}
              token1Color={token1Color}
              resetRange={committedRange}
              bordered={false}
              groupTicks={groupTicks}
            />
          </LiquidityChartStoreProvider>
        </Flex>
      ) : (
        <ChartSkeleton type={ChartType.PRICE} height={PDP_CHART_HEIGHT_PX} errorText={errorText} />
      )}
    </Flex>
  )
}
