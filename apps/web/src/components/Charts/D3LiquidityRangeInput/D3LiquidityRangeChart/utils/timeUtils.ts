import * as d3 from 'd3'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export function getTimeFormat(duration: HistoryDuration) {
  switch (duration) {
    case HistoryDuration.Day:
      // DDD HH:MM (e.g., "Mon 1:00")
      return d3.timeFormat('%a %H:%M')
    case HistoryDuration.Week:
      // MMM DD (e.g., "Jan 01")
      return d3.timeFormat('%b %d')
    case HistoryDuration.Max:
    case HistoryDuration.Year:
      // MMM YYYY (e.g., "Jan 2024")
      return d3.timeFormat('%b %Y')
    default:
      // MMM DD (e.g., "Jan 01")
      return d3.timeFormat('%b %d')
  }
}
