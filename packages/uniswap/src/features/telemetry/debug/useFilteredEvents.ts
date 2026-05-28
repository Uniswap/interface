import { useMemo } from 'react'
import type {
  AnalyticsDebugFilters,
  CapturedAnalyticsEvent,
} from 'uniswap/src/features/telemetry/debug/analyticsDebugStore'

export function useFilteredEvents(
  events: CapturedAnalyticsEvent[],
  filters: AnalyticsDebugFilters,
): CapturedAnalyticsEvent[] {
  return useMemo(() => {
    const { searchText, selectedEventNames, propertyFilters } = filters
    const lowerSearch = searchText.toLowerCase()

    return events.filter((event) => {
      // Filter by selected event names
      if (selectedEventNames.size > 0 && !selectedEventNames.has(event.eventName)) {
        return false
      }

      // Filter by search text (matches event name or any property value)
      if (lowerSearch) {
        const nameMatch = event.eventName.toLowerCase().includes(lowerSearch)
        const propMatch = Object.values(event.customProperties).some((v) =>
          String(v).toLowerCase().includes(lowerSearch),
        )
        const traceMatch = Object.values(event.traceProperties).some((v) =>
          String(v).toLowerCase().includes(lowerSearch),
        )
        if (!nameMatch && !propMatch && !traceMatch) {
          return false
        }
      }

      // Filter by property key:value pairs
      for (const { key, value } of propertyFilters) {
        const lowerValue = value.toLowerCase()
        const allProps = { ...event.customProperties, ...event.traceProperties }
        const propValue = allProps[key]
        if (propValue === undefined || !String(propValue).toLowerCase().includes(lowerValue)) {
          return false
        }
      }

      return true
    })
  }, [events, filters])
}
