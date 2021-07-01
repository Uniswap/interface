import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BrushBehavior, brushX, ScaleLinear, select } from 'd3'
import styled from 'styled-components'
import { brushHandleAccentPath, brushHandlePath } from 'components/LiquidityDepth/utils'
import usePrevious from 'hooks/usePrevious'

const Handle = styled.path<{ color: string }>`
  cursor: ew-resize;
  stroke-width: 3;
  stroke: ${({ color }) => color};
  fill: ${({ color }) => color};
`

const HandleAccent = styled.path`
  cursor: ew-resize;
  stroke-width: 1.3;
  stroke: ${({ theme }) => theme.white};
  opacity: 0.6;
`

const TooltipBackground = styled.rect`
  fill: ${({ theme }) => theme.bg2}
  opacity: 0.7
`

const Tooltip = styled.text`
  text-anchor: middle;
  dominant-baseline: middle;
  font-size: 13px;
  fill: ${({ theme }) => theme.text1};
`

export const Brush = ({
  id = 'liquidity-chart-range-input-brush',
  xScale,
  brushExtent,
  innerWidth,
  innerHeight,
  setBrushExtent,
  colors,
}: {
  id?: string
  xScale: ScaleLinear<number, number>
  brushExtent: [number, number]
  innerWidth: number
  innerHeight: number
  setBrushExtent: (extent: [number, number]) => void
  colors: {
    west: string
    east: string
  }
}) => {
  const brushRef = useRef<SVGGElement>(null)

  // only used to drag the handles on brush for performance
  const [localBrushExtent, setLocalBrushExtent] = useState<[number, number] | null>(brushExtent)

  const previousBrushExtent = usePrevious(brushExtent)

  const brushed = useCallback(
    ({ type, selection }: { type: 'brush' | 'end'; selection: [number, number] }) => {
      if (!selection) {
        return
      }

      const scaled = selection.map(xScale.invert) as [number, number]

      if (type === 'end' && (scaled[0] !== brushExtent[0] || scaled[1] !== brushExtent[1])) {
        setBrushExtent(scaled)
      } else {
        setLocalBrushExtent(scaled)
      }
    },
    [xScale.invert, brushExtent, setBrushExtent]
  )

  // initialize the brush
  useEffect(() => {
    if (!brushRef.current) return

    const brush = brushX()
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on('brush end', brushed)

    brush(select(brushRef.current))

    if (previousBrushExtent && brushExtent[0] !== previousBrushExtent[0] && brushExtent[1] !== previousBrushExtent[1]) {
      brush.move(
        // @ts-ignore
        select(brushRef.current),
        brushExtent.map(xScale)
      )
    }

    // brush linear gradient
    select(brushRef.current)
      .selectAll('.selection')
      .attr('stroke', 'none')
      .attr('fill', `url(#${id}-gradient-selection)`)
  }, [brushExtent, brushed, id, innerHeight, innerWidth, previousBrushExtent, xScale])

  return useMemo(
    () => (
      <>
        <linearGradient id={`${id}-gradient-selection`} x1="0%" y1="100%" x2="100%" y2="100%">
          <stop stopColor={colors.west} />
          <stop stopColor={colors.east} offset="1" />
        </linearGradient>

        <g ref={brushRef}>
          {localBrushExtent ? (
            <>
              {/* west handle */}
              <g transform={`translate(${xScale(localBrushExtent[0])}, 0), scale(-1, 1)`}>
                <Handle color={colors.west} d={brushHandlePath(innerHeight)} />
                <HandleAccent d={brushHandleAccentPath()} />

                <TooltipBackground y={innerHeight - 20 / 2 - 1} x={0} height={20} width={'20px'} rx="8" />
                <Tooltip transform={`scale(-1, 1)`} y={innerHeight}>
                  West
                </Tooltip>
              </g>

              {/* east handle */}
              <g transform={`translate(${xScale(localBrushExtent[1])}, 0)`}>
                <Handle color={colors.east} d={brushHandlePath(innerHeight)} />
                <HandleAccent d={brushHandleAccentPath()} />

                <TooltipBackground y={innerHeight - 20 / 2 - 1} x={0} height={20} width={'20px'} rx="8" />
                <Tooltip y={innerHeight}>East</Tooltip>
              </g>
            </>
          ) : null}
        </g>
      </>
    ),
    [colors.east, colors.west, id, innerHeight, localBrushExtent, xScale]
  )
}
