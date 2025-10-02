import { Currency } from '@uniswap/sdk-core'
import { LiquidityActiveTooltips } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/LiquidityActiveTooltips'
import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import { useLiquidityChartInteractions } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/hooks/useLiquidityChartInteractions'
import { useResponsiveDimensions } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/hooks/useResponsiveDimensions'
import { useChartPriceState } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/priceSelectors'
import { useChartViewState } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/viewSelectors'
import { useLiquidityChartStoreActions } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/useLiquidityChartStore'
import { priceToY, TickAlignment } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceToY'
import { yToPrice } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/yToPrice'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { PriceChartData } from 'components/Charts/PriceChart'
import { ChartType } from 'components/Charts/utils'
import { ChartQueryResult } from 'components/Tokens/TokenDetails/ChartSection/util'
import * as d3 from 'd3'
import { useEffect, useMemo, useRef } from 'react'
import { Flex, useSporeColors } from 'ui/src'

const D3LiquidityRangeChart = ({
  priceData,
  liquidityData,
  quoteCurrency,
  baseCurrency,
}: {
  priceData: ChartQueryResult<PriceChartData, ChartType.PRICE>
  liquidityData: ChartEntry[]
  quoteCurrency: Currency
  baseCurrency: Currency
}) => {
  const colors = useSporeColors()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const timescaleSvgRef = useRef<SVGSVGElement | null>(null)

  // Chart state
  const { zoomLevel, panY, dynamicZoomMin } = useChartViewState()
  const { minPrice, maxPrice } = useChartPriceState()
  const { initializeRenderers, drawAll, updateDimensions, setChartState, reset } = useLiquidityChartStoreActions()

  // Chart interactions
  useLiquidityChartInteractions({
    svgRef,
    liquidityData,
    zoomLevel,
    panY,
    setChartState,
    dynamicZoomMin,
  })

  // Responsive dimensions
  const dimensions = useResponsiveDimensions()
  useEffect(() => {
    updateDimensions(dimensions)
  }, [dimensions, updateDimensions])

  // Calculate full height needed for all liquidity bars (like D3Chart2)
  const barHeight = CHART_DIMENSIONS.LIQUIDITY_BAR_HEIGHT
  const barSpacing = CHART_DIMENSIONS.LIQUIDITY_BAR_SPACING
  const totalHeight = liquidityData.length * (barHeight + barSpacing)

  // Create tick-based scale for exact positioning of liquidity bars
  const baseTickScale = useMemo(() => {
    return d3
      .scaleBand()
      .domain(liquidityData.map((d: ChartEntry) => d.tick?.toString() ?? ''))
      .range([totalHeight * 1 * zoomLevel, 0]) // Use zoomed total height, highest price at top, lowest at bottom
      .paddingInner(0.05) // Small padding between bars
  }, [liquidityData, totalHeight, zoomLevel])

  const tickScale = useMemo(() => {
    const scale = (tick: string) => {
      const baseY = baseTickScale(tick)
      return baseY !== undefined ? baseY + panY : 0
    }
    // Add the scale methods
    scale.domain = () => baseTickScale.domain()
    scale.bandwidth = () => baseTickScale.bandwidth()
    scale.range = () => baseTickScale.range()
    return scale
  }, [baseTickScale, panY])

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
      tickScale,
      priceToY: ({ price, tickAlignment }: { price: number; tickAlignment?: TickAlignment }) =>
        priceToY({ price, liquidityData, tickScale, tickAlignment }),
      yToPrice: (y: number) => yToPrice({ y, liquidityData, tickScale }),
    }

    // Initialize renderers with the g element and context, and separate timescale context
    initializeRenderers({ g, timescaleG, context: renderingContext })

    // Initial draw
    drawAll()
  }, [priceData, liquidityData, colors, dimensions, tickScale, initializeRenderers, drawAll])

  // Update renderers when state changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: minPrice and maxPrice should also trigger re-renders
  useEffect(() => {
    drawAll()
  }, [minPrice, maxPrice, drawAll])

  // Reset the chart when the price data changes (currentPrice omitted)
  // biome-ignore lint/correctness/useExhaustiveDependencies: +priceData.dataHash
  useEffect(() => {
    reset()
  }, [priceData.dataHash, reset])

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
          priceData={priceData.entries}
          liquidityData={liquidityData}
        />
      </Flex>
    </Flex>
  )
}

export default D3LiquidityRangeChart
