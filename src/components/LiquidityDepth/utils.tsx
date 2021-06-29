import { ChartEntry } from './hooks'
import { scaleLinear, max, min } from 'd3'
import { Margins } from './LiquidityChartRangeInput'

export const xAccessor = (d: ChartEntry) => d.price0

export const yAccessor = (d: ChartEntry) => d.activeLiquidity

export const getScales = (series: ChartEntry[], width: number, height: number, margin: Margins) => {
  return {
    xScale: scaleLinear()
      .domain([min(series, xAccessor), max(series, xAccessor)] as number[])
      .range([margin.left, width - margin.right]),
    yScale: scaleLinear()
      .domain([0, max(series, yAccessor)] as number[])
      .range([height - margin.bottom, margin.top]),
  }
}

/*
 * Generates an SVG path for the east brush handle.
 * Apply `scale(-1, 1)` to generate west brush handle.
 *
 * |```````\
 * |  | |  |
 * |______/
 * |
 * |
 * |
 * |
 * |
 *
 */
export const brushHandlePath = (height: number) =>
  [
    // handle
    `M 0 ${height}`,
    'L 0 1',

    // head
    'h 10',
    'q 5 0, 5 5',
    'v 15',
    'q 0 5 -5 5',
    'h -10',
    `z`, // close path
  ].join(' ')

const LABEL_PADDING = 10
const LABEL_CHAR_WIDTH = 6

export const labelWidth = (label: string | undefined) =>
  label ? label.split('').length * LABEL_CHAR_WIDTH + LABEL_PADDING * 2 : 0
