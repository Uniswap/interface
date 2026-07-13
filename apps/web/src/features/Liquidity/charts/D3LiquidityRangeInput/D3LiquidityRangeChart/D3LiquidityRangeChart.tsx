import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import * as d3 from 'd3'
import { useEffect, useId, useMemo, useRef } from 'react'
import { Flex, useSporeColors } from 'ui/src'
import type { TickData } from '~/appGraphql/data/AllV3TicksQuery'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import type { ChartQueryResult, ChartType } from '~/components/Charts/utils'
import { CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import { createTickScale } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/createTickScale'
import { LiquidityActiveTooltips } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/LiquidityActiveTooltips'
import { useLiquidityChartInteractions } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/hooks/useLiquidityChartInteractions'
import { useResponsiveDimensions } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/hooks/useResponsiveDimensions'
import { useChartPriceState } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/priceSelectors'
import { useChartViewState } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/viewSelectors'
import type { LiquidityScaleSmoothing } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { useLiquidityChartStoreActions } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/useLiquidityChartStore'
import {
  priceToY,
  type TickAlignment,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceToY'
import { tickToY } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickToY'
import { yToTick } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/yToTick'
import type { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'
import { useLiquidityUrlState } from '~/features/Liquidity/Create/hooks/useLiquidityUrlState'
import type { MigratingPosition } from '~/features/Liquidity/Create/types'

export const D3LiquidityRangeChart = ({
  priceData,
  liquidityData,
  quoteCurrency,
  baseCurrency,
  migratingPosition,
  currentTick,
  tickSpacing,
  rawTicks,
  protocolVersion,
  token0Color,
  token1Color,
}: {
  priceData: ChartQueryResult<PriceChartData, ChartType.PRICE>
  liquidityData: ChartEntry[]
  quoteCurrency: Maybe<Currency>
  baseCurrency: Maybe<Currency>
  migratingPosition?: MigratingPosition
  currentTick: number
  tickSpacing: number
  rawTicks: TickData[]
  protocolVersion: ProtocolVersion
  token0Color: string
  token1Color: string
}) => {
  const colors = useSporeColors()
  const chartId = useId()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const timescaleSvgRef = useRef<SVGSVGElement | null>(null)
  // Stable, view-only state for easing the liquidity width-scale during scroll. Stored on a ref so
  // it survives the per-frame renderer re-init without going through React/store state.
  const liquidityScaleSmoothingRef = useRef<LiquidityScaleSmoothing>({})

  const { priceRangeState } = useLiquidityUrlState()

  // Chart state
  const { zoomLevel, panY } = useChartViewState()
  const { minTick, maxTick } = useChartPriceState()
  const { initializeRenderers, drawAll, updateDimensions, setChartState, reset } = useLiquidityChartStoreActions()

  // Chart interactions
  useLiquidityChartInteractions({
    svgRef,
    zoomLevel,
    panY,
    setChartState,
    tickSpacing,
  })

  // Responsive dimensions
  const dimensions = useResponsiveDimensions()
  useEffect(() => {
    updateDimensions(dimensions)
  }, [dimensions, updateDimensions])

  // Use fixed chart height for the full tick range
  // This ensures proper scaling across the entire tick space
  const totalHeight = CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT

  // Create linear tick scale for continuous tick-to-Y mapping
  // Uses FULL pool tick range (MIN_TICK to MAX_TICK) aligned to tickSpacing
  const tickScale = useMemo(() => {
    if (liquidityData.length === 0) {
      return createTickScale({ tickSpacing, size: 0, zoomLevel: 1, pan: 0 })
    }

    return createTickScale({ tickSpacing, size: totalHeight, zoomLevel, pan: panY, invert: true })
  }, [liquidityData.length, tickSpacing, totalHeight, zoomLevel, panY])

  // Initialize renderers when component mounts or data changes
  useEffect(() => {
    if (!svgRef.current || !timescaleSvgRef.current) {
      return
    }

    const svg = d3.select(svgRef.current)
    const timescaleSvg = d3.select(timescaleSvgRef.current)
    svg.selectAll('g').remove() // Only remove D3-created elements, not React elements
    timescaleSvg.selectAll('g').remove()

    const g = svg.append('g')
    const timescaleG = timescaleSvg.append('g')

    // Create rendering context
    const renderingContext = {
      chartId,
      colors,
      dimensions,
      priceData: priceData.entries,
      liquidityData,
      rawTicks,
      tickScale,
      tickSpacing,
      currentTick,
      token0Color,
      token1Color,
      priceToY: ({ price, tickAlignment }: { price: number; tickAlignment?: TickAlignment }) =>
        priceToY({ price, liquidityData, tickScale, tickAlignment }),
      tickToY: ({ tick, tickAlignment }: { tick: number; tickAlignment?: TickAlignment }) =>
        tickToY({ tick, tickScale, tickSpacing, tickAlignment }),
      yToTick: (y: number) => yToTick({ y, tickScale }),
      liquidityScaleSmoothing: liquidityScaleSmoothingRef.current,
    }

    // Initialize renderers with the g element and context, and separate timescale context
    initializeRenderers({ g, timescaleG, context: renderingContext })

    // Initial draw
    drawAll()
  }, [
    chartId,
    priceData,
    liquidityData,
    rawTicks,
    colors,
    dimensions,
    tickScale,
    initializeRenderers,
    drawAll,
    currentTick,
    tickSpacing,
    token0Color,
    token1Color,
  ])

  // Update renderers when state changes
  useEffect(() => {
    drawAll()
  }, [minTick, maxTick, zoomLevel, panY, drawAll])

  // Reset the chart when the price data changes (currentPrice omitted), maintaining the price range from the URL
  useEffect(() => {
    // oxlint-disable-next-line no-shadow
    let minTick
    // oxlint-disable-next-line no-shadow
    let maxTick

    if (migratingPosition) {
      return
    }

    if (priceRangeState.minTick !== undefined) {
      minTick = priceRangeState.minTick
    }
    if (priceRangeState.maxTick !== undefined) {
      maxTick = priceRangeState.maxTick
    }

    reset({
      minTick,
      maxTick,
    })
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [priceData.dataHash, migratingPosition, reset])

  // Reset the liquidity width-scale smoothing when the underlying data changes (so a new pool's
  // bars don't animate from the previous pool's scale) and cancel any pending settle frame on
  // data change / unmount.
  useEffect(() => {
    const smoothing = liquidityScaleSmoothingRef.current
    smoothing.displayedMaxLiquidity = undefined
    smoothing.lastFrameTimeMs = undefined
    return () => {
      if (smoothing.settleFrameId !== undefined) {
        cancelAnimationFrame(smoothing.settleFrameId)
        smoothing.settleFrameId = undefined
      }
    }
  }, [priceData.dataHash])

  return (
    <Flex opacity={dimensions.isInitialized ? 1 : 0} animation="fast" flexDirection="column">
      <Flex
        py="$spacing12"
        borderTopWidth="$spacing1"
        borderBottomWidth="$spacing1"
        borderColor="surface3"
        position="relative"
        overflow="hidden"
        $sm={{
          py: '$spacing4',
        }}
      >
        <svg
          aria-label="Liquidity Range Chart"
          ref={svgRef}
          width="100%"
          height={CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT}
          style={{
            touchAction: 'manipulation',
          }}
          onMouseEnter={() => setChartState({ isChartHovered: true })}
          onMouseMove={(e) => {
            const rect = svgRef.current?.getBoundingClientRect()
            if (rect) {
              setChartState({ hoverPriceX: e.clientX - rect.left, hoverPriceY: e.clientY - rect.top })
            }
          }}
          onMouseLeave={() => setChartState({ isChartHovered: false, hoverPriceX: undefined, hoverPriceY: undefined })}
        >
          <title>Liquidity Range Chart</title>
        </svg>
        <svg
          aria-label="Timescale Chart"
          ref={timescaleSvgRef}
          width="100%"
          height={CHART_DIMENSIONS.TIMESCALE_HEIGHT}
          style={{
            touchAction: 'none',
          }}
        >
          <title>Timescale Chart</title>
        </svg>
        <LiquidityActiveTooltips
          quoteCurrency={quoteCurrency}
          baseCurrency={baseCurrency}
          currentTick={currentTick}
          tickSpacing={tickSpacing}
          priceInverted={priceRangeState.priceInverted ?? false}
          protocolVersion={protocolVersion}
        />
      </Flex>
    </Flex>
  )
}
