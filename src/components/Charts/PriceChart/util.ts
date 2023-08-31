/* eslint-disable import/no-unused-modules */

import { bisector, ScaleLinear, timeDay, timeHour, TimeInterval, timeMinute, timeMonth } from 'd3'
import { PricePoint, TimePeriod } from 'graphql/data/util'

/**
 * Returns the minimum and maximum values in the given array of PricePoints.
 */
export function getPriceBounds(pricePoints: PricePoint[]): { min: number; max: number } {
  if (!pricePoints.length) return { min: 0, max: 0 }

  let min = pricePoints[0].value
  let max = pricePoints[0].value

  for (const pricePoint of pricePoints) {
    if (pricePoint.value < min) {
      min = pricePoint.value
    }
    if (pricePoint.value > max) {
      max = pricePoint.value
    }
  }

  return { min, max }
}

/**
 * Cleans up an array of PricePoints by removing zero values and marking gaps.
 *
 * @param pricePoints - The original array of PricePoints
 * @returns An object containing two arrays: fixedChart and blanks
 */
export function cleanUpPricePoints(pricePoints: PricePoint[]) {
  const fixedChart: PricePoint[] = [] // PricePoint array with 0 values removed
  const blanks: [PricePoint, PricePoint][] = [] // PricePoint pairs that represent blank spaces in the chart
  let lastValidPrice: PricePoint | undefined

  pricePoints.forEach((pricePoint, index) => {
    const isValueNonZero = pricePoint.value !== 0
    if (isValueNonZero) {
      const isFirstValidPrice = fixedChart.length === 0

      if (isFirstValidPrice && index !== 0) {
        const blankStart = { timestamp: pricePoints[0].timestamp, value: pricePoint.value }
        blanks.push([blankStart, pricePoint])
      }

      lastValidPrice = pricePoint
      fixedChart.push(pricePoint)
    }
  })

  if (lastValidPrice) {
    const isLastPriceInvalid = lastValidPrice !== pricePoints[pricePoints.length - 1]

    if (isLastPriceInvalid) {
      const blankEnd = { timestamp: pricePoints[pricePoints.length - 1].timestamp, value: lastValidPrice.value }
      blanks.push([lastValidPrice, blankEnd])
    }
  }

  return { prices: fixedChart, blanks }
}

/**
 * Retrieves the nearest PricePoint to a given x-coordinate based on a linear time scale.
 *
 * @param x - The x-coordinate to find the nearest PricePoint for.
 * @param prices - An array of PricePoints, assumed to be sorted by timestamp.
 * @param timeScale - A D3 ScaleLinear instance for time scaling.
 * @returns The nearest PricePoint to the given x-coordinate.
 */
export function getNearestPricePoint(
  x: number,
  pricePoints: PricePoint[],
  timeScale: ScaleLinear<number, number, never>
): PricePoint | undefined {
  // Convert the x-coordinate back to a timestamp
  const targetTimestamp = timeScale.invert(x)

  // Use bisector for O(log N) complexity, assumes prices are sorted by timestamp
  const bisect = bisector((d: PricePoint) => d.timestamp).left
  const index = bisect(pricePoints, targetTimestamp, 1)

  // Get potential nearest PricePoints
  const previousPoint = pricePoints[index - 1]
  const nextPoint = pricePoints[index]

  // Default to the previous point if next point doesn't exist
  if (!nextPoint) {
    return previousPoint
  }

  // Calculate temporal distances to target timestamp
  const distanceToPrevious = Math.abs(targetTimestamp.valueOf() - previousPoint.timestamp.valueOf())
  const distanceToNext = Math.abs(nextPoint.timestamp.valueOf() - targetTimestamp.valueOf())

  // Return the PricePoint with the smallest temporal distance to targetTimestamp
  return distanceToPrevious < distanceToNext ? previousPoint : nextPoint
}

const TIME_PERIOD_INTERVAL_TABLE: Record<TimePeriod, { interval: TimeInterval; step: number }> = {
  [TimePeriod.HOUR]: { interval: timeMinute, step: 10 }, // spaced 10 minutes apart
  [TimePeriod.DAY]: { interval: timeHour, step: 4 }, // spaced 4 hours apart
  [TimePeriod.WEEK]: { interval: timeDay, step: 1 }, // spaced 1 day apart
  [TimePeriod.MONTH]: { interval: timeDay, step: 7 }, // spaced 1 week apart
  [TimePeriod.YEAR]: { interval: timeMonth, step: 2 }, // spaced 2 months apart
}

export function getTicks(startTime: number, endTime: number, timePeriod: TimePeriod, maxTicks: number) {
  if (maxTicks === 0) return []

  // Prevent ticks from being too close to the edges of the axis
  const tickMargin = (endTime - startTime) / 24

  const startDate = new Date((startTime + tickMargin) * 1000)
  const endDate = new Date((endTime - tickMargin) * 1000)

  const { interval, step } = TIME_PERIOD_INTERVAL_TABLE[timePeriod]
  const ticks = interval.range(startDate, endDate, step).map((x) => x.valueOf() / 1000) // convert to seconds

  if (ticks.length <= maxTicks) return ticks

  const newTicks = []
  const tickSpacing = Math.floor(ticks.length / maxTicks)
  for (let i = 1; i < ticks.length; i += tickSpacing) {
    newTicks.push(ticks[i])
  }
  return newTicks
}
