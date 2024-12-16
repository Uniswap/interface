import { OffScreenHandleV2, brushHandleAccentPathV2, brushHandlePathV2 } from 'components/LiquidityChartRangeInput/svg'
import { BrushBehavior, D3BrushEvent, ScaleLinear, brushY, select } from 'd3'
import usePrevious from 'hooks/usePrevious'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSporeColors } from 'ui/src'
import { useTranslation } from 'uniswap/src/i18n'

// flips the handles draggers when close to the container edges
const FLIP_HANDLE_THRESHOLD_PX = 20

// margin to prevent tick snapping from putting the brush off screen
const BRUSH_EXTENT_MARGIN_PX = 2

/**
 * Returns true if every element in `a` maps to the
 * same pixel coordinate as elements in `b`
 */
const compare = (a: [number, number], b: [number, number], yScale: ScaleLinear<number, number>): boolean => {
  // normalize pixels to 1 decimals
  const aNorm = a.map((y) => yScale(y).toFixed(1))
  const bNorm = b.map((y) => yScale(y).toFixed(1))
  return aNorm.every((v, i) => v === bNorm[i])
}

export const Brush2 = ({
  id,
  yScale,
  interactive,
  brushExtent,
  setBrushExtent,
  hideHandles,
  width,
  height,
  offset,
}: {
  id: string
  yScale: ScaleLinear<number, number>
  interactive: boolean
  brushExtent: [number, number]
  setBrushExtent: (extent: [number, number], mode: string | undefined) => void
  width: number
  height: number
  offset: number
  hideHandles?: boolean
}) => {
  const colors = useSporeColors()
  const brushRef = useRef<SVGGElement | null>(null)
  const brushBehavior = useRef<BrushBehavior<SVGGElement> | null>(null)

  const { t } = useTranslation()

  // only used to drag the handles on brush for performance
  const [localBrushExtent, setLocalBrushExtent] = useState<[number, number] | null>(brushExtent)

  const previousBrushExtent = usePrevious(brushExtent)

  const effectiveBrushWidth = width - offset

  const brushed = useCallback(
    (event: D3BrushEvent<unknown>) => {
      const { type, selection, mode } = event

      if (!selection) {
        setLocalBrushExtent(null)
        return
      }

      const scaled = (selection as [number, number]).map(yScale.invert) as [number, number]

      // avoid infinite render loop by checking for change
      if (type === 'end' && !compare(brushExtent, scaled, yScale)) {
        setBrushExtent(scaled, mode)
      }

      setLocalBrushExtent(scaled)
    },
    [yScale, brushExtent, setBrushExtent],
  )

  // keep local and external brush extent in sync
  // i.e. snap to ticks on brush end
  useEffect(() => {
    setLocalBrushExtent(brushExtent)
  }, [brushExtent])

  // initialize the brush
  useEffect(() => {
    if (!brushRef.current) {
      return
    }

    brushBehavior.current = brushY<SVGGElement>()
      .extent([
        [0, Math.max(0, yScale(0) + BRUSH_EXTENT_MARGIN_PX)],
        [width, height - BRUSH_EXTENT_MARGIN_PX],
      ])
      .handleSize(30)
      .filter(() => interactive)
      .on('brush end', brushed)

    brushBehavior.current(select(brushRef.current))

    if (previousBrushExtent && compare(brushExtent, previousBrushExtent, yScale)) {
      select(brushRef.current)
        .transition()
        .call(brushBehavior.current.move as any, brushExtent.map(yScale))
    }

    // brush linear gradient
    select(brushRef.current)
      .selectAll('.selection')
      .attr('stroke', 'none')
      .attr('fill-opacity', '0.1')
      .attr('fill', `url(#${id}-gradient-selection)`)
  }, [brushExtent, brushed, id, height, interactive, previousBrushExtent, yScale, offset, effectiveBrushWidth, width])

  // respond to yScale changes only
  useEffect(() => {
    if (!brushRef.current || !brushBehavior.current) {
      return
    }

    brushBehavior.current.move(select(brushRef.current) as any, brushExtent.map(yScale) as any)
  }, [brushExtent, yScale])

  // variables to help render the SVGs
  const flipNorthHandle = localBrushExtent && yScale(localBrushExtent[0]) > FLIP_HANDLE_THRESHOLD_PX
  const flipSouthHandle = localBrushExtent && yScale(localBrushExtent[1]) > height - FLIP_HANDLE_THRESHOLD_PX

  const showNorthArrow = localBrushExtent && (yScale(localBrushExtent[0]) < 0 || yScale(localBrushExtent[1]) < 0)
  const showSouthArrow =
    localBrushExtent && (yScale(localBrushExtent[0]) > height || yScale(localBrushExtent[1]) > height)

  const northHandleInView =
    localBrushExtent && yScale(localBrushExtent[0]) >= 0 && yScale(localBrushExtent[0]) <= height
  const southHandleInView =
    localBrushExtent && yScale(localBrushExtent[1]) >= 0 && yScale(localBrushExtent[1]) <= height

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
            <rect x={offset} y="0" width={effectiveBrushWidth} height={height} />
          </clipPath>
        </defs>

        {/* will host the d3 brush */}
        <g ref={brushRef} clipPath={`url(#${id}-brush-clip)`} />

        {/* custom brush handles */}
        {localBrushExtent && !hideHandles && (
          <>
            {northHandleInView ? (
              <g
                transform={`translate(${offset}, ${Math.max(0, yScale(localBrushExtent[0]))}), scale(1, ${
                  flipNorthHandle ? '-1' : '1'
                })`}
                cursor={interactive ? 'ns-resize' : 'default'}
                pointerEvents="none"
              >
                <g>
                  <path
                    color={colors.neutral2.val}
                    stroke={colors.neutral2.val}
                    opacity={0.6}
                    d={brushHandlePathV2(effectiveBrushWidth)}
                  />
                  <path
                    color={colors.neutral2.val}
                    stroke={colors.neutral2.val}
                    strokeWidth={4}
                    strokeLinecap="round"
                    d={brushHandleAccentPathV2(effectiveBrushWidth)}
                  />
                </g>
              </g>
            ) : null}

            {southHandleInView ? (
              <g
                transform={`translate(${offset}, ${yScale(localBrushExtent[1])}), scale(1, ${flipSouthHandle ? '-1' : '1'})`}
                cursor={interactive ? 'ns-resize' : 'default'}
                pointerEvents="none"
              >
                <g>
                  <path
                    color={colors.neutral2.val}
                    stroke={colors.neutral2.val}
                    opacity={0.6}
                    d={brushHandlePathV2(effectiveBrushWidth)}
                  />
                  <path
                    color={colors.neutral2.val}
                    stroke={colors.neutral2.val}
                    strokeWidth={4}
                    strokeLinecap="round"
                    d={brushHandleAccentPathV2(effectiveBrushWidth)}
                  />
                </g>
              </g>
            ) : null}

            {showNorthArrow && (
              <g transform={`translate(${width - 18}, 16) scale(1, -1)`}>
                <OffScreenHandleV2 color={colors.accent1.val} />
                {!showSouthArrow && (
                  <text
                    transform="scale(-1, 1)"
                    x={10}
                    y={5}
                    fill={colors.accent1.val}
                    fontSize={10}
                    alignmentBaseline="middle"
                  >
                    {t('range.outOfView')}
                  </text>
                )}
              </g>
            )}
            {showSouthArrow && (
              <g transform={`translate(${width - 18}, ${height - 16}) `}>
                <OffScreenHandleV2 color={colors.accent1.val} />
                <text
                  transform="scale(-1, -1)"
                  x={10}
                  y={-3}
                  fill={colors.accent1.val}
                  fontSize={10}
                  alignmentBaseline="middle"
                >
                  {t('range.outOfView')}
                </text>
              </g>
            )}
          </>
        )}
      </>
    ),
    [
      id,
      colors,
      offset,
      effectiveBrushWidth,
      height,
      localBrushExtent,
      hideHandles,
      northHandleInView,
      yScale,
      flipNorthHandle,
      interactive,
      southHandleInView,
      flipSouthHandle,
      showNorthArrow,
      width,
      t,
      showSouthArrow,
    ],
  )
}
