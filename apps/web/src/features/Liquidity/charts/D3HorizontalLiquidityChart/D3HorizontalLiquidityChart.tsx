import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import * as d3 from 'd3'
import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Flex, useSporeColors } from 'ui/src'
import { TickData } from '~/appGraphql/data/AllV3TicksQuery'
import { TickTooltipContent } from '~/features/Liquidity/charts/ActiveLiquidityChart/TickTooltip'
import { useHorizontalLiquidityChartInteractions } from '~/features/Liquidity/charts/D3HorizontalLiquidityChart/hooks/useHorizontalLiquidityChartInteractions'
import type { HorizontalLiquidityScaleSmoothing } from '~/features/Liquidity/charts/D3HorizontalLiquidityChart/types'
import {
  useHorizontalLiquidityChartSelector,
  useHorizontalLiquidityChartStoreActions,
} from '~/features/Liquidity/charts/D3HorizontalLiquidityChart/useHorizontalLiquidityChartStore'
import {
  createEntryFromBucket,
  findBucketForTick,
} from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/bucketUtils'
import { createTickScale } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/createTickScale'
import { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'
import { getDisplayPriceFromTick } from '~/features/Liquidity/utils/getTickToPrice'

const DEFAULT_HEIGHT = 300

function D3HorizontalLiquidityChartInner({
  liquidityData,
  rawTicks,
  currentTick,
  tickSpacing,
  token0Color,
  token1Color,
  baseCurrency,
  quoteCurrency,
  priceInverted,
  protocolVersion,
  height = DEFAULT_HEIGHT,
  onActionsReady,
}: {
  liquidityData: ChartEntry[]
  rawTicks: TickData[]
  currentTick: number
  tickSpacing: number
  token0Color: string
  token1Color: string
  baseCurrency: Maybe<Currency>
  quoteCurrency: Maybe<Currency>
  priceInverted: boolean
  protocolVersion: ProtocolVersion
  height?: number
  onActionsReady?: (actions: { zoomIn: () => void; zoomOut: () => void; resetView: () => void }) => void
}) {
  const colors = useSporeColors()
  const chartId = useId()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  // Ephemeral height-scale easing state; a ref so it survives the per-frame renderer re-init.
  const liquidityScaleSmoothingRef = useRef<HorizontalLiquidityScaleSmoothing>({})
  const [chartWidth, setChartWidth] = useState(0)
  const [hoveredY, setHoveredY] = useState<number | undefined>(undefined)
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  // Subscribe to store state
  const zoomLevel = useHorizontalLiquidityChartSelector((s) => s.zoomLevel)
  const panX = useHorizontalLiquidityChartSelector((s) => s.panX)
  const hoveredTick = useHorizontalLiquidityChartSelector((s) => s.hoveredTick)
  const hoveredX = useHorizontalLiquidityChartSelector((s) => s.hoveredX)
  const renderedBuckets = useHorizontalLiquidityChartSelector((s) => s.renderedBuckets)
  const { initializeRenderers, drawAll, updateDimensions, setChartState, zoomIn, zoomOut, resetView } =
    useHorizontalLiquidityChartStoreActions()

  // Expose zoom actions to parent (ref avoids re-firing when parent passes unstable callback)
  const onActionsReadyRef = useRef(onActionsReady)
  useEffect(() => {
    onActionsReadyRef.current = onActionsReady
  })
  useEffect(() => {
    onActionsReadyRef.current?.({ zoomIn, zoomOut, resetView })
  }, [zoomIn, zoomOut, resetView])

  // Measure container width via ResizeObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return undefined
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        if (width > 0) {
          setChartWidth(width)
          updateDimensions({ width, height })
        }
      }
    })

    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [height, updateDimensions])

  // Create horizontal tick scale (memoized, depends on tickSpacing, zoomLevel, panX, chartWidth)
  const tickScale = useMemo(() => {
    if (liquidityData.length === 0 || chartWidth === 0) {
      return createTickScale({ tickSpacing, size: 0, zoomLevel: 1, pan: 0 })
    }

    return createTickScale({ tickSpacing, size: chartWidth, zoomLevel, pan: panX })
  }, [liquidityData.length, tickSpacing, chartWidth, zoomLevel, panX])

  // Chart interactions (horizontal pan/zoom)
  useHorizontalLiquidityChartInteractions({
    svgRef,
    zoomLevel,
    panX,
    setChartState,
    tickSpacing,
    chartWidth,
  })

  // Coalesce draw calls within a single animation frame to avoid redundant DOM work
  const drawRafRef = useRef<number | undefined>(undefined)
  useEffect(
    () => () => {
      if (drawRafRef.current !== undefined) {
        cancelAnimationFrame(drawRafRef.current)
      }
      const smoothing = liquidityScaleSmoothingRef.current
      if (smoothing.settleFrameId !== undefined) {
        cancelAnimationFrame(smoothing.settleFrameId)
        smoothing.settleFrameId = undefined
      }
    },
    [],
  )
  const scheduleDraw = useCallback(() => {
    if (drawRafRef.current !== undefined) {
      cancelAnimationFrame(drawRafRef.current)
    }
    drawRafRef.current = requestAnimationFrame(() => {
      drawRafRef.current = undefined
      drawAll()
    })
  }, [drawAll])

  // Refs to dedupe hoveredTick/hoveredSegment writes when the cursor stays within the same bucket.
  // Per-pixel mouse moves keep the same ChartEntry/segment identity, so subscribers (e.g. the
  // header price display) only re-render when the hovered bucket actually changes.
  const lastBucketStartTickRef = useRef<number | undefined>(undefined)
  const lastEntryRef = useRef<ChartEntry | undefined>(undefined)
  const lastSegmentRef = useRef<{ startTick: number; endTick: number } | undefined>(undefined)

  // Hover handlers
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!renderedBuckets || renderedBuckets.length === 0) {
        return
      }

      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      setHoveredY(y)

      const hoveredTickValue = tickScale.axisToTick(x)
      const bucket = findBucketForTick(hoveredTickValue, renderedBuckets)

      if (bucket) {
        const bucketChanged = bucket.startTick !== lastBucketStartTickRef.current
        const prevSegment = lastSegmentRef.current
        const segmentChanged =
          !prevSegment ||
          prevSegment.startTick !== bucket.segmentStartTick ||
          prevSegment.endTick !== bucket.segmentEndTick

        if (bucketChanged) {
          lastEntryRef.current = createEntryFromBucket({ bucket, tick: bucket.startTick })
          lastBucketStartTickRef.current = bucket.startTick
        }
        if (segmentChanged) {
          lastSegmentRef.current = { startTick: bucket.segmentStartTick, endTick: bucket.segmentEndTick }
        }

        setChartState(
          bucketChanged || segmentChanged
            ? {
                hoveredX: x,
                hoveredTick: lastEntryRef.current,
                hoveredSegment: lastSegmentRef.current,
                isChartHovered: true,
              }
            : { hoveredX: x, isChartHovered: true },
        )
        scheduleDraw()
      } else {
        const wasInBucket = lastBucketStartTickRef.current !== undefined
        if (wasInBucket) {
          lastBucketStartTickRef.current = undefined
          lastEntryRef.current = undefined
          lastSegmentRef.current = undefined
        }
        setChartState(
          wasInBucket
            ? { hoveredX: x, hoveredTick: undefined, hoveredSegment: undefined, isChartHovered: true }
            : { hoveredX: x, isChartHovered: true },
        )
        scheduleDraw()
      }
    },
    [renderedBuckets, tickScale, setChartState, scheduleDraw],
  )

  const handleMouseLeave = useCallback(() => {
    setHoveredY(undefined)
    lastBucketStartTickRef.current = undefined
    lastEntryRef.current = undefined
    lastSegmentRef.current = undefined
    setChartState({
      hoveredX: undefined,
      hoveredTick: undefined,
      hoveredSegment: undefined,
      isChartHovered: false,
    })
    scheduleDraw()
  }, [setChartState, scheduleDraw])

  // Calculate current price for tooltip
  const currentPrice = useMemo(
    () =>
      Number(
        getDisplayPriceFromTick({
          tick: currentTick,
          baseCurrency,
          quoteCurrency,
          priceInverted,
          protocolVersion,
        }),
      ),
    [currentTick, baseCurrency, quoteCurrency, priceInverted, protocolVersion],
  )

  // Push tickScale into the store so renderers always use the latest, then redraw
  useEffect(() => {
    setChartState({ tickScale })
    scheduleDraw()
  }, [tickScale, setChartState, scheduleDraw])

  // Initialize renderers when data ready (tickScale is read from store at draw time)
  useEffect(() => {
    if (!svgRef.current || chartWidth === 0 || liquidityData.length === 0 || rawTicks.length === 0) {
      return
    }

    const svg = d3.select(svgRef.current)
    svg.selectAll('g').remove()

    const g = svg.append('g')

    // New data/dimensions: drop any in-flight height-scale easing so the first draw snaps to the
    // fresh target instead of animating from the previous scale.
    const smoothing = liquidityScaleSmoothingRef.current
    if (smoothing.settleFrameId !== undefined) {
      cancelAnimationFrame(smoothing.settleFrameId)
    }
    smoothing.displayedMaxLiquidity = undefined
    smoothing.lastFrameTimeMs = undefined
    smoothing.settleFrameId = undefined

    const renderingContext = {
      chartId,
      colors,
      dimensions: { width: chartWidth, height },
      liquidityData,
      rawTicks,
      tickSpacing,
      currentTick,
      token0Color: priceInverted ? token1Color : token0Color,
      token1Color: priceInverted ? token0Color : token1Color,
      baseCurrency,
      quoteCurrency,
      priceInverted,
      protocolVersion,
      liquidityScaleSmoothing: smoothing,
    }

    initializeRenderers({ g, context: renderingContext })
    drawAll()
  }, [
    chartId,
    liquidityData,
    rawTicks,
    colors,
    chartWidth,
    height,
    initializeRenderers,
    drawAll,
    currentTick,
    tickSpacing,
    token0Color,
    token1Color,
    baseCurrency,
    quoteCurrency,
    priceInverted,
    protocolVersion,
  ])

  // Redraw when zoom/pan changes (tickScale pushed to store above triggers draw via drawAll)
  // biome-ignore lint/correctness/useExhaustiveDependencies: zoomLevel and panX should trigger redraws
  useEffect(() => {
    drawAll()
  }, [zoomLevel, panX, drawAll])

  // Tooltip positioning: follow cursor, clamp to chart bounds on all edges
  const TOOLTIP_OFFSET = 12
  const tooltipWidth = tooltipRef.current?.offsetWidth ?? 160
  const tooltipHeight = tooltipRef.current?.offsetHeight ?? 80
  const showTooltip = hoveredTick !== undefined && hoveredX !== undefined

  let tooltipX = (hoveredX ?? 0) + TOOLTIP_OFFSET
  let tooltipY = (hoveredY ?? 0) - TOOLTIP_OFFSET

  // Clamp right edge
  if (tooltipX + tooltipWidth > chartWidth) {
    tooltipX = (hoveredX ?? 0) - tooltipWidth - TOOLTIP_OFFSET
  }
  // Clamp left edge
  tooltipX = Math.max(0, tooltipX)
  // Clamp bottom edge
  if (tooltipY + tooltipHeight > height) {
    tooltipY = height - tooltipHeight
  }
  // Clamp top edge
  tooltipY = Math.max(0, tooltipY)

  const dottedBackground = {
    backgroundImage: `radial-gradient(circle, ${colors.surface3Hovered.val} 1px, transparent 1px)`,
    backgroundSize: '20px 20px',
  }

  return (
    <Flex ref={containerRef} overflow="hidden" position="relative" style={dottedBackground}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        style={{ touchAction: 'manipulation' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {showTooltip && (
        <Flex ref={tooltipRef} position="absolute" left={tooltipX} top={tooltipY}>
          <TickTooltipContent
            currentPrice={currentPrice}
            hoveredTick={hoveredTick}
            currentTick={currentTick}
            quoteCurrency={quoteCurrency}
            baseCurrency={baseCurrency}
            tickSpacing={tickSpacing}
            priceInverted={priceInverted}
            protocolVersion={protocolVersion}
          />
        </Flex>
      )}
    </Flex>
  )
}

export const D3HorizontalLiquidityChart = memo(D3HorizontalLiquidityChartInner)
