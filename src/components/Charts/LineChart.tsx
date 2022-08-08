import { Group } from '@visx/group'
import { LinePath } from '@visx/shape'
import { CurveFactory, ScaleLinear } from 'd3'
import { ReactNode } from 'react'
import { Color } from 'theme/styled'

type PricePoint = { value: number; timestamp: number }

interface LineChartProps {
  data: PricePoint[]
  xscale: ScaleLinear<number, number, never>
  yscale: ScaleLinear<number, number, never>
  marginTop: number
  curve: CurveFactory
  color: Color
  strokeWidth: number
  children?: ReactNode
  width: number
  height: number
}

export default function LineChart({
  data,
  xscale,
  yscale,
  marginTop,
  curve,
  color,
  strokeWidth,
  width,
  height,
  children,
}: LineChartProps) {
  return (
    <svg width={width} height={height}>
      <Group top={marginTop}>
        <LinePath
          curve={curve}
          stroke={color}
          strokeWidth={strokeWidth}
          data={data}
          x={(d: PricePoint) => xscale(d.timestamp) ?? 0}
          y={(d: PricePoint) => yscale(d.value) ?? 0}
        />
      </Group>
      {children}
    </svg>
  )
}
