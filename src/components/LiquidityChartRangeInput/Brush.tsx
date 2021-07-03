import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BrushBehavior, brushX, ScaleLinear, select } from 'd3'
import styled from 'styled-components'
import { brushHandleAccentPath, brushHandlePath } from 'components/LiquidityChartRangeInput/svg'
import usePrevious from 'hooks/usePrevious'

const Handle = styled.path<{ color: string }>`
  cursor: ew-resize;
  pointer-events: none;

  stroke-width: 3;
  stroke: ${({ color }) => color};
  fill: ${({ color }) => color};
`

const HandleAccent = styled.path`
  cursor: ew-resize;
  pointer-events: none;

  stroke-width: 1.3;
  stroke: ${({ theme }) => theme.white};
  opacity: 0.6;
`

const TooltipBackground = styled.rect`
  fill: ${({ theme }) => theme.black};
`

const Tooltip = styled.text`
  text-anchor: middle;
  font-size: 13px;
  fill: ${({ theme }) => theme.text1};
`

export const Brush = ({
  id,
  xScale,
  interactive,
  brushLabelValue,
  brushExtent,
  setBrushExtent,
  innerWidth,
  innerHeight,
  colors,
}: {
  id: string
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
  const brushRef = useRef<SVGGElement | null>(null)
  const brushBehavior = useRef<BrushBehavior<SVGGElement> | null>(null)

  // only used to drag the handles on brush for performance
  const [localBrushExtent, setLocalBrushExtent] = useState<[number, number] | null>(brushExtent)
  const [showLabels, setShowLabels] = useState(false)

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

    brushBehavior.current = brushX<SVGGElement>()
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .handleSize(30)
      .filter(() => interactive)
      .on('brush end', brushed)

    brushBehavior.current(select(brushRef.current))

    if (previousBrushExtent && brushExtent[0] !== previousBrushExtent[0] && brushExtent[1] !== previousBrushExtent[1]) {
      brushBehavior.current.move(select(brushRef.current) as any, brushExtent.map(xScale) as any)
    }

    // brush linear gradient
    select(brushRef.current)
      .selectAll('.selection')
      .attr('stroke', 'none')
      .attr('fill-opacity', '0.1')
      .attr('fill', `url(#${id}-gradient-selection)`)
  }, [brushExtent, brushed, id, innerHeight, innerWidth, interactive, previousBrushExtent, xScale])

  // respond to xScale changes only
  useEffect(() => {
    if (!brushRef.current || !brushBehavior.current) return

    brushBehavior.current.move(select(brushRef.current) as any, brushExtent.map(xScale) as any)
    // dependency on brushExtent would start an update loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xScale])

  useEffect(() => {
    setShowLabels(true)
    const timeout = setTimeout(() => setShowLabels(true), 500)
    return () => clearTimeout(timeout)
  }, [localBrushExtent])

  const flipWestHandle = localBrushExtent && xScale(localBrushExtent[0]) > 15
  const flipEastHandle = localBrushExtent && xScale(localBrushExtent[1]) > innerWidth - 15

  return useMemo(
    () => (
      <>
        <defs>
          <linearGradient id={`${id}-gradient-selection`} x1="0%" y1="100%" x2="100%" y2="100%">
            <stop stopColor={colors.west} />
            <stop stopColor={colors.east} offset="1" />
          </linearGradient>

          {/* clips at exactly the svg area */}
          <clipPath id={`${id}-brush-clip`}>
            <rect x="0" y="0" width={innerWidth} height="100%" />
          </clipPath>

          {/* leave some gap for the handles to show */}
          <clipPath id={`${id}-handles-clip`}>
            <rect x="0" y="0" width="100%" height="100%" />
          </clipPath>
        </defs>

        {/* will host the d3 brush */}
        <g ref={brushRef} clipPath={`url(#${id}-brush-clip)`} />

        {/* custom brush handles */}
        {localBrushExtent && (
          <>
            {/* west handle */}
            <g
              transform={`translate(${Math.max(0, xScale(localBrushExtent[0]))}, 0), scale(${
                flipWestHandle ? '-1' : '1'
              }, 1)`}
            >
              <g clipPath={`url(#${id}-handles-clip)`}>
                <Handle color={colors.west} d={brushHandlePath(innerHeight)} />
                <HandleAccent d={brushHandleAccentPath()} />
              </g>

              {showLabels && (
                <g transform={`translate(50,0), scale(${flipWestHandle ? '1' : '-1'}, 1)`}>
                  <TooltipBackground y="0" x="-30" height="30" width="60" rx="8" />
                  <Tooltip transform={`scale(-1, 1)`} y="15" dominantBaseline="middle">
                    {brushLabelValue(localBrushExtent[0])}
                  </Tooltip>
                </g>
              )}
            </g>

            {/* east handle */}
            <g
              transform={`translate(${Math.min(innerWidth, xScale(localBrushExtent[1]))}, 0), scale(${
                flipEastHandle ? '-1' : '1'
              }, 1)`}
            >
              <g clipPath={`url(#${id}-handles-clip)`}>
                <Handle color={colors.east} d={brushHandlePath(innerHeight)} />
                <HandleAccent d={brushHandleAccentPath()} />
              </g>

              {showLabels && (
                <g transform={`translate(50,0), scale(${flipEastHandle ? '-1' : '1'}, 1)`}>
                  <TooltipBackground y="0" x="-30" height="30" width="60" rx="8" />
                  <Tooltip y="15" dominantBaseline="middle">
                    {brushLabelValue(localBrushExtent[1])}
                  </Tooltip>
                </g>
              )}
            </g>
          </>
        )}
      </>
    ),
    [brushLabelValue, colors.east, colors.west, flipWestHandle, id, innerHeight, localBrushExtent, showLabels, xScale]
  )
}
