import { axisRight, Axis as d3Axis, NumberValue, ScaleLinear, select } from 'd3'
import { useMemo } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

const TEXT_Y_OFFSET = 5

const Axis = ({
  axisGenerator,
  yScale,
  height,
}: {
  axisGenerator: d3Axis<NumberValue>
  height: number
  yScale: ScaleLinear<number, number>
}) => {
  const axisRef = (axis: SVGGElement) => {
    select(axis)
      .call(axisGenerator)
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g.selectAll('text').attr('transform', function (d) {
          const yCoordinate = yScale(d as number)
          if (yCoordinate < TEXT_Y_OFFSET) {
            return `translate(0, ${TEXT_Y_OFFSET})`
          }
          if (yCoordinate > height - TEXT_Y_OFFSET) {
            return `translate(0, ${-TEXT_Y_OFFSET})`
          }
          return ''
        }),
      )
  }

  return <g ref={axisRef} />
}

export const AxisRight = ({
  yScale,
  offset = 0,
  min,
  current,
  max,
  height,
}: {
  yScale: ScaleLinear<number, number>
  height: number
  offset?: number
  min?: number
  current?: number
  max?: number
}) => {
  const { formatNumberOrString } = useLocalizationContext()
  const tickValues = useMemo(() => {
    const minCoordinate = min ? yScale(min) : undefined
    const maxCoordinate = max ? yScale(max) : undefined
    const currentCoordinate = current ? yScale(current) : undefined
    if (minCoordinate && currentCoordinate && Math.abs(minCoordinate - currentCoordinate) < TEXT_Y_OFFSET) {
      return [min, max].filter(Boolean) as number[]
    }
    if (maxCoordinate && currentCoordinate && Math.abs(maxCoordinate - currentCoordinate) < TEXT_Y_OFFSET) {
      return [min, max].filter(Boolean) as number[]
    }
    return [min, current, max].filter(Boolean) as number[]
  }, [current, max, min, yScale])

  return (
    <g transform={`translate(${offset}, 0)`} className="axis-right">
      <Axis
        axisGenerator={axisRight(yScale)
          .tickValues(tickValues)
          .tickFormat((d) =>
            formatNumberOrString({
              value: d as number,
              type: NumberType.TokenQuantityStats,
            }),
          )}
        height={height}
        yScale={yScale}
      />
    </g>
  )
}
