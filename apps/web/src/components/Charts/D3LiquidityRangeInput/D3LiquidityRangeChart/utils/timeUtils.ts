import { GraphQLApi } from '@universe/api'
import * as d3 from 'd3'

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
