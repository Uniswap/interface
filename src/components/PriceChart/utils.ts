import { scaleLinear } from 'd3-scale'
import { curveBasis, line } from 'd3-shape'
import { getYForX, parse, Path } from 'react-native-redash'
import { GraphData, Price, PriceList } from 'src/components/PriceChart/types'
import { dimensions } from 'src/styles/sizing'
import { theme as FixedTheme } from 'src/styles/theme'
import { logger } from 'src/utils/logger'

// sets the height of the chart short enough on small devices that the
// "Your balance" section will always show above the fold
// we can't use useResponsiveProps for this because CHART_HEIGHT gets
// used in non-component code related to chart functionality
export const CHART_HEIGHT = dimensions.fullHeight < FixedTheme.breakpoints.sm.height ? 180 : 310
export const CHART_WIDTH = dimensions.fullWidth

export const NUM_GRAPHS = 5
// number of points in graph
// will interpolate up or down to the precision
// 365 is a balance between performance and precision
// most paths have fewer than or exactly 365 points
export const GRAPH_PRECISION = 365

/**
 * Normalizes a Path by rescaling the x-axis and mapping to the Path.
 * Required because different date ranges have different number of points.
 * redash requires the same number of points to interpolate between paths.
 * @param path to normalize
 * @param precision number of dat points in the new path
 * @param width of the canvas
 **/
export function normalizePath(path: Path, precision: number, width: number): Path {
  const scaleX = scaleLinear()
    .domain([0, precision - 1])
    .range([0, width])

  const values = Array(precision)
    .fill([])
    .map((_, index) => {
      const x = scaleX(index)
      const y = getYForX(path, x)
      return [x, y] as [number, number]
    })

  return parse(
    line()
      .x(([x]) => x)
      .y(([, y]) => y)
      .curve(curveBasis)(values) as string
  )
}

/** Constructs a drawable Path from a PriceList */
export function buildGraph(
  priceList: NullUndefined<PriceList>,
  precision: number,
  width = CHART_WIDTH,
  height = CHART_HEIGHT
): GraphData | null {
  if (!priceList || priceList.length === 0) return null
  priceList = priceList.slice().reverse()

  const formattedValues = priceList
    .filter((value): value is Price => !!value)
    .map((price) => [price.timestamp, price.close] as [number, number])

  const prices = formattedValues.map(([, price]) => price)
  const dates = formattedValues.map(([date]) => date)

  const lowPrice = Math.min(...prices)
  const highPrice = Math.max(...prices)
  const openPrice = prices[0]
  const closePrice = prices[prices.length - 1]

  const openDate = dates[0]
  const closeDate = dates[dates.length - 1]

  if (
    openDate === undefined ||
    closeDate === undefined ||
    openPrice === undefined ||
    closePrice === undefined
  )
    return null

  // TODO: [MOB-3876] consider using `scaleTime`
  const scaleX = scaleLinear().domain([openDate, closeDate]).range([0, width])
  const scaleY = scaleLinear().domain([lowPrice, highPrice]).range([height, 0])

  try {
    // normalize brings all paths to the same precision (number of points)
    const path = normalizePath(
      parse(
        line()
          .x(([x]) => scaleX(x))
          .y(([, y]) => scaleY(y))
          .curve(curveBasis)(formattedValues) as string
      ),
      precision,
      width
    )

    return {
      openDate,
      closeDate,
      lowPrice,
      highPrice,
      openPrice,
      closePrice,
      path,
    }
  } catch (e: unknown) {
    logger.error(
      'PriceChart/utils',
      'buildGraph',
      `Error while normalizing path. ${formattedValues}`
    )
    return null
  }
}
