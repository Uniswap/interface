import { ChartEntry } from './hooks'
import { scaleLinear, max, min } from 'd3'

export interface Dimensions {
  width: number
  height: number
}

export interface Margins {
  top: number
  right: number
  bottom: number
  left: number
}
export const xAccessor = (d: ChartEntry) => d.price0
export const yAccessor = (d: ChartEntry) => d.activeLiquidity

export const getDimensions = (dimensions: Dimensions, margin: Margins) => ({
  width: dimensions.width - margin.left - margin.right,
  height: dimensions.height - margin.top - margin.bottom,
})

export const getScales = (series: ChartEntry[], width: number, height: number) => {
  return {
    xScale: scaleLinear()
      .domain([min(series, xAccessor), max(series, xAccessor)] as number[])
      .range([0, width]),
    yScale: scaleLinear()
      .domain([0, max(series, yAccessor)] as number[])
      .range([height, 0]),
  }
}

/*
 * Generates an SVG path for the east brush handle.
 * Apply `scale(-1, 1)` to generate west brush handle.
 *
 *    |```````\
 *    |  | |  |
 *    |______/
 *    |
 *    |
 *    |
 *    |
 *    |
 *
 * https://medium.com/@dennismphil/one-side-rounded-rectangle-using-svg-fb31cf318d90
 */
export const brushHandlePath = (height: number) =>
  [
    // handle
    `M 0 ${height}`,
    'L 0 1',

    // head
    'h 10', // horizontal line
    'q 5 0, 5 5', // rounded corner
    'v 18', // vertical line
    'q 0 5 -5 5', // rounded corner
    'h -10', // horizontal line
    `z`, // close path
  ].join(' ')

export const brushHandleAccentPath = () => ['m 5 6', 'v 16', 'M 0 0', 'm 9 6', 'v 16', 'z'].join(' ')

const LABEL_PADDING = 10
const LABEL_CHAR_WIDTH = 6

export const getTextWidth = (s: string | undefined) =>
  s ? s.split('').length * LABEL_CHAR_WIDTH + LABEL_PADDING * 2 : 0
