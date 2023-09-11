import { timeDay, timeHour, TimeInterval, timeMinute, timeMonth } from 'd3'
import { TimePeriod } from 'graphql/data/util'

const fiveMinutes = timeMinute.every(5)
const TIME_PERIOD_INTERVAL_TABLE: Record<TimePeriod, { interval: TimeInterval; step: number }> = {
  [TimePeriod.HOUR]: fiveMinutes
    ? { interval: fiveMinutes, step: 2 } // spaced 10 minutes apart at times that end in 0 or 5
    : { interval: timeMinute, step: 10 }, // spaced 10 minutes apart, backup incase fiveMinutes doesn't initialize
  [TimePeriod.DAY]: { interval: timeHour, step: 4 }, // spaced 4 hours apart
  [TimePeriod.WEEK]: { interval: timeDay, step: 1 }, // spaced 1 day apart
  [TimePeriod.MONTH]: { interval: timeDay, step: 7 }, // spaced 1 week apart
  [TimePeriod.YEAR]: { interval: timeMonth, step: 2 }, // spaced 2 months apart
}

/**
 * Returns an array of tick values for a given time range and time period.
 * This function makes sure that the ticks are evenly spaced and are not too close to the edges.
 */
export function getTicks(startTime: number, endTime: number, timePeriod: TimePeriod, maxTicks: number) {
  if (maxTicks === 0 || endTime <= startTime) return []

  // Prevents ticks from being too close to the axis edge
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
