import { GraphQLApi } from '@universe/api'
import * as d3 from 'd3'

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

export function getTimeFormat(duration: GraphQLApi.HistoryDuration) {
  switch (duration) {
    case GraphQLApi.HistoryDuration.Day:
      // DDD HH:MM (e.g., "Mon 1:00")
      return d3.timeFormat('%a %H:%M')
    case GraphQLApi.HistoryDuration.Week:
      // MMM DD (e.g., "Jan 01")
      return d3.timeFormat('%b %d')
    case GraphQLApi.HistoryDuration.Max:
    case GraphQLApi.HistoryDuration.Year:
      // MMM YYYY (e.g., "Jan 2024")
      return d3.timeFormat('%b %Y')
    default:
      // MMM DD (e.g., "Jan 01")
      return d3.timeFormat('%b %d')
  }
}
