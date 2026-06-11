import { Group } from '@visx/group'
import { AreaClosed, LinePath } from '@visx/shape'
import { CurveFactory, ScaleLinear } from 'd3'
import React, { ReactNode, useId } from 'react'
import { ColorTokens } from 'ui/src'

interface LineChartProps<T> {
  data: T[]
  getX: (t: T) => number
  getY: (t: T) => number
  marginTop?: number
  curve: CurveFactory
  color: ColorTokens
  strokeWidth: number
  children?: ReactNode
  width: number
  height: number
  showGradientFill?: boolean
  yScale?: ScaleLinear<number, number>
}

function LineChartInner<T>({
  data,
  getX,
  getY,
  marginTop,
  curve,
  color,
  strokeWidth,
  width,
  height,
  children,
  showGradientFill = false,
  yScale,
}: LineChartProps<T>) {
  const gradientId = useId().replace(/:/g, '')
  const chartBottom = height - (marginTop ?? 0)

  return (
    <svg width={width} height={height}>
      {showGradientFill ? (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.16} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
      ) : null}
      <Group top={marginTop}>
        {showGradientFill && yScale ? (
          <AreaClosed
            curve={curve}
            data={data}
            fill={`url(#${gradientId})`}
            x={getX}
            y={getY}
            y0={() => chartBottom}
            yScale={yScale}
          />
        ) : null}
        <LinePath curve={curve} stroke={color} strokeWidth={strokeWidth} data={data} x={getX} y={getY} />
      </Group>
      {children}
    </svg>
  )
}

export const LineChart = React.memo(LineChartInner) as typeof LineChartInner
