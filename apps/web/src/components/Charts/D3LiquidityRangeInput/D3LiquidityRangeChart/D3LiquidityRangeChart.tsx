import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import * as d3 from 'd3'
import { useEffect, useMemo, useRef } from 'react'
import { Flex, useSporeColors } from 'ui/src'
import { TickData } from '~/appGraphql/data/AllV3TicksQuery'
import { LiquidityActiveTooltips } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/LiquidityActiveTooltips'
import { CHART_DIMENSIONS } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import { useLiquidityChartInteractions } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/hooks/useLiquidityChartInteractions'
import { useResponsiveDimensions } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/hooks/useResponsiveDimensions'
import { useChartPriceState } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/priceSelectors'
import { useChartViewState } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/viewSelectors'
import type { LinearTickScale } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { useLiquidityChartStoreActions } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/useLiquidityChartStore'
import { priceToY, TickAlignment } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceToY'
import { tickToY } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickToY'
import { yToTick } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/yToTick'
import { ChartEntry } from '~/components/Charts/LiquidityRangeInput/types'
import { PriceChartData } from '~/components/Charts/PriceChart'
import { ChartQueryResult, ChartType } from '~/components/Charts/utils'
import { useLiquidityUrlState } from '~/components/Liquidity/Create/hooks/useLiquidityUrlState'
import { InitialPosition } from '~/components/Liquidity/Create/types'

const D3LiquidityRangeChart = ({
  priceData,
  liquidityData,
  quoteCurrency,
  baseCurrency,
  initialPosition,
  currentTick,
  tickSpacing,
  rawTicks,
  protocolVersion,
}: {
  priceData: ChartQueryResult<PriceChartData, ChartType.PRICE>
  liquidityData: ChartEntry[]
  quoteCurrency: Maybe<Currency>
  baseCurrency: Maybe<Currency>
  initialPosition?: InitialPosition
  currentTick: number
  tickSpacing: number
  rawTicks: TickData[]
  protocolVersion: ProtocolVersion
}) => {
  const colors = useSporeColors()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const timescaleSvgRef = useRef<SVGSVGElement | null>(null)

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
  const tickScale: LinearTickScale = useMemo(() => {
    if (liquidityData.length === 0) {
      // Default scale when no data
      return {
        tickToY: () => 0,
        yToTick: () => 0,
        minTick: 0,
        maxTick: 0,
        range: [0, 0],
      }
    }

    // Use full pool tick range (aligned to tickSpacing)
    // This ensures we visualize the entire tick space, not just where liquidity exists
    const fullMinTick = nearestUsableTick(TickMath.MIN_TICK, tickSpacing)
    const fullMaxTick = nearestUsableTick(TickMath.MAX_TICK, tickSpacing)

    // Calculate Y range with zoom
    const scaledHeight = totalHeight * zoomLevel
    // Higher ticks at top (Y=0 + panY), lower ticks at bottom
    const yTop = panY
    const yBottom = scaledHeight + panY

    // Create d3 linear scale (inverted: high tick -> low Y)
    const d3Scale = d3.scaleLinear().domain([fullMaxTick, fullMinTick]).range([yTop, yBottom])

    return {
      tickToY: (tick: number) => d3Scale(tick),
      yToTick: (y: number) => d3Scale.invert(y),
      minTick: fullMinTick,
      maxTick: fullMaxTick,
      range: [yTop, yBottom],
    }
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
      colors,
      dimensions,
      priceData: priceData.entries,
      liquidityData,
      rawTicks,
      tickScale,
      tickSpacing,
      currentTick,
      priceToY: ({ price, tickAlignment }: { price: number; tickAlignment?: TickAlignment }) =>
        priceToY({ price, liquidityData, tickScale, tickAlignment }),
      tickToY: ({ tick, tickAlignment }: { tick: number; tickAlignment?: TickAlignment }) =>
        tickToY({ tick, tickScale, tickAlignment }),
      yToTick: (y: number) => yToTick({ y, tickScale }),
    }

    // Initialize renderers with the g element and context, and separate timescale context
    initializeRenderers({ g, timescaleG, context: renderingContext })

    // Initial draw
    drawAll()
  }, [
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
  ])

  // Update renderers when state changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: minTick, maxTick, zoomLevel, panY should trigger re-renders
  useEffect(() => {
    drawAll()
  }, [minTick, maxTick, zoomLevel, panY, drawAll])

  // Reset the chart when the price data changes (currentPrice omitted), maintaining the price range from the URL
  // biome-ignore lint/correctness/useExhaustiveDependencies: priceRangeState should not trigger re-renders
  useEffect(() => {
    let minTick
    let maxTick

    if (initialPosition) {
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
  }, [priceData.dataHash, initialPosition, reset])

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
          ref={svgRef}
          width="100%"
          height={CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT}
          style={{
            touchAction: 'manipulation',
          }}
          onMouseEnter={() => setChartState({ isChartHovered: true })}
          onMouseLeave={() => setChartState({ isChartHovered: false })}
        ></svg>
        <svg
          ref={timescaleSvgRef}
          width="100%"
          height={CHART_DIMENSIONS.TIMESCALE_HEIGHT}
          style={{
            touchAction: 'none',
          }}
        ></svg>
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

export default D3LiquidityRangeChart
