import { brushHandleAccentPath, brushHandlePath, OffScreenHandle } from 'components/Charts/LiquidityRangeInput/svg'
import { BrushBehavior, brushY, D3BrushEvent, ScaleLinear, select } from 'd3'
import usePrevious from 'hooks/usePrevious'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'

// flips the handles draggers when close to the container edges
const FLIP_HANDLE_THRESHOLD_PX = 20

// margin to prevent tick snapping from putting the brush off screen
const BRUSH_EXTENT_MARGIN_PX = 2

/**
 * Returns true if every element in `a` maps to the
 * same pixel coordinate as elements in `b`
 */
// eslint-disable-next-line max-params
const compare = (a: [number, number], b: [number, number], yScale: ScaleLinear<number, number>): boolean => {
  // normalize pixels to 1 decimals
  const aNorm = a.map((y) => yScale(y).toFixed(1))
  const bNorm = b.map((y) => yScale(y).toFixed(1))
  return aNorm.every((v, i) => v === bNorm[i])
}

// Convert [minPrice, maxPrice] to [yMax, yMin]
const toYScale = (extent: [number, number], yScale: ScaleLinear<number, number>): [number, number] => {
  return [yScale(extent[1]), yScale(extent[0])]
}

// Convert [yMax, yMin] to [minPrice, maxPrice]
const toPriceExtent = (selection: [number, number], yScale: ScaleLinear<number, number>): [number, number] => {
  return [yScale.invert(selection[1]), yScale.invert(selection[0])]
}

const normalizeExtent = (extent: [number, number]): [number, number] =>
  extent[0] < extent[1] ? extent : [extent[1], extent[0]]

export const Brush = ({
  id,
  yScale,
  interactive,
  brushExtent,
  setBrushExtent,
  hideHandles,
  width,
  height,
}: {
  id: string
  yScale: ScaleLinear<number, number>
  interactive: boolean
  // [min, max] price values
  brushExtent: [number, number]
  setBrushExtent: (extent: [number, number], mode: string | undefined) => void
  width: number
  height: number
  hideHandles?: boolean
}) => {
  const colors = useSporeColors()
  const brushRef = useRef<SVGGElement | null>(null)
  const brushBehavior = useRef<BrushBehavior<SVGGElement> | null>(null)

  const { t } = useTranslation()

  // only used to drag the handles on brush for performance
  const [localBrushExtent, setLocalBrushExtent] = useState<[number, number] | null>(brushExtent)

  const previousBrushExtent = usePrevious(brushExtent)

  // keep local and external brush extent in sync
  // i.e. snap to ticks on brush end
  const brushInProgressRef = useRef(false)

  useEffect(() => {
    if (brushInProgressRef.current) {
      return
    }
    setLocalBrushExtent(brushExtent)
  }, [brushExtent])

  // initialize the brush
  useEffect(() => {
    if (!brushRef.current) {
      return
    }

    const normalizedExtent = normalizeExtent(brushExtent)
    const scaledExtent = toYScale(normalizedExtent, yScale)

    brushBehavior.current = brushY<SVGGElement>()
      .extent([
        // x0, y0 (top left)
        [0, BRUSH_EXTENT_MARGIN_PX],
        // x1, y1 (bottom right)
        [width, height - BRUSH_EXTENT_MARGIN_PX],
      ])
      .handleSize(30)
      .filter(() => interactive)
      .filter((event) => {
        // Allow interactions only if the event target is part of the brush selection or handles
        const target = event.target as SVGElement
        return target.classList.contains('selection') || target.classList.contains('handle')
      })
      .on('brush', (event: D3BrushEvent<unknown>) => {
        const { selection } = event
        brushInProgressRef.current = true

        if (!selection) {
          setLocalBrushExtent(null)
          return
        }

        // Update only the local extent during dragging
        const priceExtent = normalizeExtent(toPriceExtent(selection as [number, number], yScale))
        setLocalBrushExtent(priceExtent)
      })
      .on('end', (event: D3BrushEvent<unknown>) => {
        const { selection, mode } = event

        if (!selection) {
          setLocalBrushExtent(null)
          return
        }

        // Finalize state update on end
        const priceExtent = normalizeExtent(toPriceExtent(selection as [number, number], yScale))
        if (!compare(normalizedExtent, priceExtent, yScale)) {
          setBrushExtent(priceExtent, mode)
        }
        setLocalBrushExtent(priceExtent)
        brushInProgressRef.current = false
      })

    brushBehavior.current(select(brushRef.current))

    if (
      !brushInProgressRef.current &&
      previousBrushExtent &&
      compare(normalizedExtent, normalizeExtent(previousBrushExtent), yScale)
    ) {
      select(brushRef.current)
        .transition()
        .call(brushBehavior.current.move as any, scaledExtent)
    }

    select(brushRef.current).selectAll('.overlay').attr('cursor', 'default')

    // brush linear gradient
    select(brushRef.current)
      .selectAll('.selection')
      .attr('stroke', 'none')
      .attr('fill-opacity', '0.1')
      .attr('fill', `url(#${id}-gradient-selection)`)
      .attr('cursor', 'grab')
  }, [brushExtent, id, height, interactive, previousBrushExtent, yScale, width, setBrushExtent])

  // respond to yScale changes only
  useEffect(() => {
    if (!brushRef.current || !brushBehavior.current) {
      return
    }

    brushBehavior.current.move(
      select(brushRef.current) as any,
      normalizeExtent(toYScale(brushExtent as [number, number], yScale)),
    )
  }, [brushExtent, yScale])

  const normalizedBrushExtent = normalizeExtent(localBrushExtent ?? brushExtent)
  const flipNorthHandle = yScale(normalizedBrushExtent[1]) < FLIP_HANDLE_THRESHOLD_PX
  const flipSouthHandle = yScale(normalizedBrushExtent[0]) > height - FLIP_HANDLE_THRESHOLD_PX

  const showNorthArrow = yScale(normalizedBrushExtent[0]) < 0 || yScale(normalizedBrushExtent[1]) < 0
  const showSouthArrow = yScale(normalizedBrushExtent[0]) > height || yScale(normalizedBrushExtent[1]) > height

  const southHandleInView = yScale(normalizedBrushExtent[0]) >= 0 && yScale(normalizedBrushExtent[0]) <= height
  const northHandleInView = yScale(normalizedBrushExtent[1]) >= 0 && yScale(normalizedBrushExtent[1]) <= height

  return useMemo(
    () => (
      <>
        <defs>
          <linearGradient id={`${id}-gradient-selection`} x1="0%" y1="100%" x2="100%" y2="100%">
            <stop stopColor={colors.accent1.val} />
            <stop stopColor={colors.accent1.val} offset="1" />
          </linearGradient>

          {/* clips at exactly the svg area */}
          <clipPath id={`${id}-brush-clip`}>
            <rect x={0} y="0" width={width} height={height} />
          </clipPath>
        </defs>

        {/* will host the d3 brush */}
        <g ref={brushRef} clipPath={`url(#${id}-brush-clip)`} />

        {/* custom brush handles */}
        {!hideHandles && (
          <>
            {northHandleInView ? (
              <g
                transform={`translate(0, ${Math.max(0, yScale(normalizedBrushExtent[1]))}), scale(1, ${
                  flipNorthHandle ? '1' : '-1'
                })`}
                cursor={interactive ? 'ns-resize' : 'default'}
                pointerEvents="none"
              >
                <g>
                  <path
                    color={colors.neutral2.val}
                    stroke={colors.neutral2.val}
                    opacity={0.6}
                    d={brushHandlePath(width)}
                  />
                  <path
                    color={colors.neutral2.val}
                    stroke={colors.neutral2.val}
                    strokeWidth={4}
                    strokeLinecap="round"
                    d={brushHandleAccentPath(width)}
                  />
                </g>
              </g>
            ) : null}

            {southHandleInView ? (
              <g
                transform={`translate(0, ${yScale(normalizedBrushExtent[0])}), scale(1, ${flipSouthHandle ? '-1' : '1'})`}
                cursor={interactive ? 'ns-resize' : 'default'}
                pointerEvents="none"
              >
                <g>
                  <path
                    color={colors.neutral2.val}
                    stroke={colors.neutral2.val}
                    opacity={0.6}
                    d={brushHandlePath(width)}
                  />
                  <path
                    color={colors.neutral2.val}
                    stroke={colors.neutral2.val}
                    strokeWidth={4}
                    strokeLinecap="round"
                    d={brushHandleAccentPath(width)}
                  />
                </g>
              </g>
            ) : null}

            {showNorthArrow && (
              <g transform="translate(18, 16) scale(1,-1)">
                <OffScreenHandle color={colors.accent1.val} />
                <text
                  x={14}
                  y={-3}
                  fill={colors.accent1.val}
                  fontSize={10}
                  alignmentBaseline="middle"
                  transform="scale(1,-1)"
                >
                  {t('range.outOfView')}
                </text>
              </g>
            )}
            {showSouthArrow && (
              <g transform={`translate(18, ${height - 16}) `}>
                <OffScreenHandle color={colors.accent1.val} />
                {!showNorthArrow && (
                  <text x={14} y={5} fill={colors.accent1.val} fontSize={10} alignmentBaseline="middle">
                    {t('range.outOfView')}
                  </text>
                )}
              </g>
            )}
          </>
        )}
      </>
    ),
    [
      id,
      colors.accent1.val,
      colors.neutral2.val,
      width,
      height,
      normalizedBrushExtent,
      hideHandles,
      northHandleInView,
      yScale,
      flipNorthHandle,
      interactive,
      southHandleInView,
      flipSouthHandle,
      showNorthArrow,
      t,
      showSouthArrow,
    ],
  )
}
