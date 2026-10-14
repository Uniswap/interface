import { axisRight, Axis as d3Axis, NumberValue, ScaleLinear, select } from 'd3'
import { useMemo } from 'react'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { formatPriceWithSubscript } from '~/pages/PoolDetails/components/formatPriceWithSubscript'

const AXIS_SUBSCRIPT_THRESHOLD = 0.01

/** Vertical nudge applied to a tick label that would otherwise render past the edge of the pane. */
const TEXT_Y_OFFSET = 5

/** Rendered height of an axis tick label: two labels closer together than this overlap. */
const LABEL_HEIGHT = 14

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

/**
 * Picks the price labels the right axis can show without them landing on top of each other: a label
 * is dropped when it sits within a label height of one that is kept.
 */
export const getAxisTickValues = ({
  yScale,
  height,
  min,
  current,
  max,
}: {
  yScale: ScaleLinear<number, number>
  height: number
  min?: number
  current?: number
  max?: number
}): number[] => {
  const minCoordinate = min ? yScale(min) : undefined
  const maxCoordinate = max ? yScale(max) : undefined
  const currentCoordinate = current ? yScale(current) : undefined
  const isInsidePane = (coordinate: number): boolean => coordinate >= 0 && coordinate <= height

  // On a zoomed-out domain (the "All time" filter) the position's range collapses to a fraction of a
  // pixel and both bound labels land in the same place, where only one of them fits. A full-range
  // position's upper bound is Number.MAX_SAFE_INTEGER and its label sits far outside the pane, so
  // both bounds have to be on screen before either is dropped.
  const boundsCollide =
    minCoordinate !== undefined &&
    maxCoordinate !== undefined &&
    isInsidePane(minCoordinate) &&
    isInsidePane(maxCoordinate) &&
    Math.abs(minCoordinate - maxCoordinate) < LABEL_HEIGHT
  const lowerBound = boundsCollide ? undefined : min

  if (minCoordinate && currentCoordinate && Math.abs(minCoordinate - currentCoordinate) < LABEL_HEIGHT) {
    return [lowerBound, max].filter(Boolean) as number[]
  }
  if (maxCoordinate && currentCoordinate && Math.abs(maxCoordinate - currentCoordinate) < LABEL_HEIGHT) {
    return [lowerBound, max].filter(Boolean) as number[]
  }
  return [lowerBound, current, max].filter(Boolean) as number[]
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
  const locale = useCurrentLocale()
  const tickValues = useMemo(
    () => getAxisTickValues({ yScale, height, min, current, max }),
    [current, height, max, min, yScale],
  )

  return (
    <g transform={`translate(${offset}, 0)`} className="axis-right">
      <Axis
        axisGenerator={axisRight(yScale)
          .tickValues(tickValues)
          .tickFormat((d) =>
            formatPriceWithSubscript({
              price: d as number,
              locale,
              formatNumberOrString,
              numberType: NumberType.TokenQuantityStats,
              subscriptThreshold: AXIS_SUBSCRIPT_THRESHOLD,
            }),
          )}
        height={height}
        yScale={yScale}
      />
    </g>
  )
}
