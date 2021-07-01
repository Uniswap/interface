import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { brushX, ScaleLinear, select } from 'd3'
import styled from 'styled-components'
import { brushHandleAccentPath, brushHandlePath } from 'components/LiquidityChartRangeInput/svg'
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
  opacity: 1;
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
  interactive,
  brushLabelValue,
  brushExtent,
  setBrushExtent,
  innerWidth,
  innerHeight,
  colors,
}: {
  id?: string
  xScale: ScaleLinear<number, number>
  interactive: boolean
  brushLabelValue: (x: number) => string
  brushExtent: [number, number]
  setBrushExtent: (extent: [number, number]) => void
  innerWidth: number
  innerHeight: number
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
        setLocalBrushExtent(null)
        return
      }

      const scaled = selection.map(xScale.invert) as [number, number]

      if (type === 'end') {
        if (scaled[0] !== brushExtent[0] || scaled[1] !== brushExtent[1]) {
          setBrushExtent(scaled)
        }
      }

      setLocalBrushExtent(scaled)
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
      .filter(() => !interactive)
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
  }, [brushExtent, brushed, id, innerHeight, innerWidth, interactive, previousBrushExtent, xScale])

  return useMemo(
    () => (
      <>
        <linearGradient id={`${id}-gradient-selection`} x1="0%" y1="100%" x2="100%" y2="100%">
          <stop stopColor={colors.west} />
          <stop stopColor={colors.east} offset="1" />
        </linearGradient>

        <g ref={brushRef} />
        <g>
          {localBrushExtent ? (
            <>
              {/* west handle */}
              <g transform={`translate(${xScale(localBrushExtent[0])}, 0), scale(-1, 1)`}>
                <Handle color={colors.west} d={brushHandlePath(innerHeight)} />
                <HandleAccent d={brushHandleAccentPath()} />

                <TooltipBackground y={innerHeight - 30 / 2} x="-30" height="30" width="60" rx="8" />
                <Tooltip transform={`scale(-1, 1)`} y={innerHeight}>
                  {brushLabelValue(localBrushExtent[0])}
                </Tooltip>
              </g>

              {/* east handle */}
              <g transform={`translate(${xScale(localBrushExtent[1])}, 0)`}>
                <Handle color={colors.east} d={brushHandlePath(innerHeight)} />
                <HandleAccent d={brushHandleAccentPath()} />

                <TooltipBackground y={innerHeight - 30 / 2} x="-30" height="30" width="60" rx="8" />
                <Tooltip y={innerHeight}>{brushLabelValue(localBrushExtent[1])}</Tooltip>
              </g>
            </>
          ) : null}
        </g>
      </>
    ),
    [brushLabelValue, colors.east, colors.west, id, innerHeight, localBrushExtent, xScale]
  )
}
