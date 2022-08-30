import { Group } from '@visx/group'
import { LinePath } from '@visx/shape'
import { CurveFactory } from 'd3'
import React from 'react'
import { ReactNode } from 'react'
import { useTheme } from 'styled-components/macro'
import { Color } from 'theme/styled'

interface LineChartProps<T> {
  data: T[]
  getX: (t: T) => number
  getY: (t: T) => number
  marginTop?: number
  curve: CurveFactory
  color?: Color
  strokeWidth: number
  children?: ReactNode
  width: number
  height: number
}

function LineChart<T>({
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
}: LineChartProps<T>) {
  const theme = useTheme()
  return (
    <svg width={width} height={height}>
      <Group top={marginTop}>
        <LinePath
          curve={curve}
          stroke={color ?? theme.accentAction}
          strokeWidth={strokeWidth}
          data={data}
          x={getX}
          y={getY}
        />
      </Group>
      {children}
    </svg>
  )
}

export default React.memo(LineChart) as typeof LineChart
