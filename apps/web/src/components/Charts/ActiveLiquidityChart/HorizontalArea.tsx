import { ChartEntry } from 'components/LiquidityChartRangeInput/types'
import { ScaleLinear } from 'd3'
import styled from 'lib/styled-components'

const Bar = styled.rect<{ fill?: string }>`
  opacity: 0.5;
  stroke: ${({ fill, theme }) => fill ?? theme.accent1};
  fill: ${({ fill, theme }) => fill ?? theme.accent1};
`

export const HorizontalArea = ({
  series,
  xScale,
  yScale,
  xValue,
  yValue,
  fill,
  brushDomain,
  selectedFill,
  containerHeight,
}: {
  series: ChartEntry[]
  xScale: ScaleLinear<number, number>
  yScale: ScaleLinear<number, number>
  xValue: (d: ChartEntry) => number
  yValue: (d: ChartEntry) => number
  brushDomain?: [number, number]
  containerHeight: number
  fill?: string
  selectedFill?: string
}) => {
  return (
    <>
      {series
        .filter((d) => {
          const value = yScale(yValue(d))
          return value > 0 && value <= containerHeight
        })
        .map((d, i) => {
          const price = yValue(d)
          const isInDomain = brushDomain && price >= brushDomain[0] && price <= brushDomain[1]
          return (
            <Bar
              key={i}
              x={xScale(0)}
              y={yScale(price)}
              width={xScale(xValue(d)) - xScale(0)}
              height={0.2}
              fill={isInDomain ? selectedFill : fill}
              rx={1}
              ry={1}
            />
          )
        })}
    </>
  )
}
