import * as d3 from 'd3'
import { ONE_DAY_MS } from 'utilities/src/time/time'

export function findClosestPriceDataPoint({
  priceData,
  mouseX,
  chartWidth,
}: {
  priceData: { time: number; value: number }[]
  mouseX: number
  chartWidth: number
}): { time: number; value: number } | undefined {
  if (priceData.length === 0) {
    return undefined
  }

  const firstMs = priceData[0].time * 1000
  const lastMs = priceData[priceData.length - 1].time * 1000
  const totalMs = lastMs - firstMs

  if (totalMs === 0) {
    return priceData[0]
  }

  const cursorMs = firstMs + (mouseX / chartWidth) * totalMs

  return priceData.reduce((prev, curr) =>
    Math.abs(curr.time * 1000 - cursorMs) < Math.abs(prev.time * 1000 - cursorMs) ? curr : prev,
  )
}

const HOURLY_LABEL_MAX_SPAN_MS = 2 * ONE_DAY_MS
const DAILY_LABEL_MAX_SPAN_MS = 180 * ONE_DAY_MS

/**
 * Picks a tick label format from the span the data actually covers, not the
 * selected history duration — a young pool charted with "1Y" or "All" selected
 * may only span days, and month/year labels would all render the same value.
 */
export function getTimeFormat([startDate, endDate]: [Date, Date]): (date: Date) => string {
  const spanMs = endDate.getTime() - startDate.getTime()

  if (spanMs <= HOURLY_LABEL_MAX_SPAN_MS) {
    // DDD HH:MM (e.g., "Mon 1:00")
    return d3.timeFormat('%a %H:%M')
  }

  if (spanMs <= DAILY_LABEL_MAX_SPAN_MS) {
    // MMM DD (e.g., "Jan 01")
    return d3.timeFormat('%b %d')
  }

  // MMM YYYY (e.g., "Jan 2024")
  return d3.timeFormat('%b %Y')
}
