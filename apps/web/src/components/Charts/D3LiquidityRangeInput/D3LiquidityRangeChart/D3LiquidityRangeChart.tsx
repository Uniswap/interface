import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import { useResponsiveDimensions } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/hooks/useResponsiveDimensions'
import {
  useChartStoreActions,
  useChartStoreState,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/useChartStore'
import { priceToY } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceToY'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { PriceChartData } from 'components/Charts/PriceChart'
import * as d3 from 'd3'
import { useEffect, useMemo, useRef } from 'react'
import { Flex, useSporeColors } from 'ui/src'

const D3LiquidityRangeChart = ({
  priceData,
  liquidityData,
}: {
  priceData: PriceChartData[]
  liquidityData: ChartEntry[]
}) => {
  const colors = useSporeColors()
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Responsive dimensions
  const dimensions = useResponsiveDimensions()

  // Chart state
  const { zoomLevel, panY, minPrice, maxPrice } = useChartStoreState()
  const { initializeRenderers, drawAll, updateDimensions } = useChartStoreActions()

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
    if (!svgRef.current) {
      return
    }

    const svg = d3.select(svgRef.current)
    svg.selectAll('g').remove() // Only remove D3-created elements, not React elements

    const g = svg.append('g')

    // Create rendering context
    const renderingContext = {
      colors,
      dimensions,
      priceData,
      liquidityData,
      tickScale,
      priceToY: (price: number) => priceToY({ price, liquidityData, tickScale }),
    }

    // Initialize renderers with the g element and context
    initializeRenderers(g, renderingContext)

    // Initial draw
    drawAll()
  }, [priceData, liquidityData, colors, dimensions, tickScale, initializeRenderers, drawAll])

  // Update renderers when state changes
  useEffect(() => {
    drawAll()
  }, [minPrice, maxPrice, drawAll])

  return (
    <Flex opacity={dimensions.isInitialized ? 1 : 0} animation="fast">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{
          touchAction: 'manipulation',
        }}
      ></svg>
    </Flex>
  )
}

export default D3LiquidityRangeChart
