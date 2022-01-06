import { scaleLinear } from 'd3-scale'
import { curveBasis, line } from 'd3-shape'
import { getYForX, parse, Path } from 'react-native-redash'

export function takeSubset(arr: Array<any> | undefined, end: number) {
  return arr?.slice(0, end)
}

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
