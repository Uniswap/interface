import { isDevEnv } from '@universe/environment'
import type { AnalyticsDebugBridge } from 'utilities/src/telemetry/analytics/analyticsDebugCapture'
import { devtools } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

export interface CapturedAnalyticsEvent {
  id: number
  timestamp: Date
  eventName: string
  customProperties: Record<string, unknown>
  traceProperties: Record<string, unknown>
  amplitudeMetadata?: Record<string, unknown>
}

export interface PropertyFilter {
  key: string
  value: string
}

export interface AnalyticsDebugFilters {
  searchText: string
  selectedEventNames: Set<string>
  propertyFilters: PropertyFilter[]
}

export interface AnalyticsDebugState {
  enabled: boolean
  expanded: boolean
  globalDetailLevel: 1 | 2 | 3
  events: CapturedAnalyticsEvent[]
  newEventCount: number
  knownEventNames: Set<string>
  filters: AnalyticsDebugFilters
  position: { x: number; y: number }
  size: { width: number; height: number }
  actions: {
    setEnabled: (enabled: boolean) => void
    toggleEnabled: () => void
    toggleExpanded: () => void
    setExpanded: (expanded: boolean) => void
    setDetailLevel: (level: 1 | 2 | 3) => void
    addEvent: (event: Omit<CapturedAnalyticsEvent, 'id'>) => void
    enrichEventWithAmplitudeMetadata: (
      match: { eventName: string; timestamp: Date },
      metadata: Record<string, unknown>,
    ) => void
    clearEvents: () => void
    resetNewEventCount: () => void
    setSearchText: (text: string) => void
    toggleEventNameFilter: (eventName: string) => void
    addPropertyFilter: (filter: PropertyFilter) => void
    removePropertyFilter: (index: number) => void
    clearFilters: () => void
    setPosition: (position: { x: number; y: number }) => void
    setSize: (size: { width: number; height: number }) => void
  }
}

const MAX_EVENTS = 500
let nextEventId = 0

export const analyticsDebugStore = createStore<AnalyticsDebugState>()(
  devtools(
    (set, get) => ({
      enabled: false,
      expanded: false,
      globalDetailLevel: 2,
      events: [],
      newEventCount: 0,
      knownEventNames: new Set<string>(),
      filters: {
        searchText: '',
        selectedEventNames: new Set<string>(),
        propertyFilters: [],
      },
      position: { x: 20, y: 100 },
      size: { width: 420, height: 500 },
      actions: {
        setEnabled(enabled: boolean): void {
          set({ enabled })
          if (!enabled) {
            set({ events: [], newEventCount: 0, knownEventNames: new Set<string>() })
          }
        },
        toggleEnabled(): void {
          const { enabled, actions } = get()
          actions.setEnabled(!enabled)
          if (!enabled) {
            actions.setExpanded(true)
          }
        },
        toggleExpanded(): void {
          const { expanded } = get()
          if (!expanded) {
            set({ expanded: true, newEventCount: 0 })
          } else {
            set({ expanded: false })
          }
        },
        setExpanded(expanded: boolean): void {
          set({ expanded, ...(expanded ? { newEventCount: 0 } : {}) })
        },
        setDetailLevel(level: 1 | 2 | 3): void {
          set({ globalDetailLevel: level })
        },
        addEvent(event: Omit<CapturedAnalyticsEvent, 'id'>): void {
          const { events, expanded, newEventCount, knownEventNames } = get()
          const newEvent: CapturedAnalyticsEvent = { ...event, id: nextEventId++ }
          const updatedEvents = [...events, newEvent]

          // Trim to max buffer size
          if (updatedEvents.length > MAX_EVENTS) {
            updatedEvents.splice(0, updatedEvents.length - MAX_EVENTS)
          }

          const updatedNames = new Set(knownEventNames)
          updatedNames.add(event.eventName)

          set({
            events: updatedEvents,
            knownEventNames: updatedNames,
            newEventCount: expanded ? 0 : newEventCount + 1,
          })
        },
        enrichEventWithAmplitudeMetadata(
          match: { eventName: string; timestamp: Date },
          metadata: Record<string, unknown>,
        ): void {
          const { events } = get()
          // Match by event name and approximate timestamp (within 5 seconds)
          const matchIndex = events.findLastIndex(
            (e) =>
              e.eventName === match.eventName &&
              !e.amplitudeMetadata &&
              Math.abs(e.timestamp.getTime() - match.timestamp.getTime()) < 5000,
          )

          if (matchIndex >= 0) {
            const updatedEvents = [...events]
            const existing = updatedEvents[matchIndex]
            if (existing) {
              updatedEvents[matchIndex] = { ...existing, amplitudeMetadata: metadata }
            }
            set({ events: updatedEvents })
          }
        },
        clearEvents(): void {
          set({ events: [], newEventCount: 0, knownEventNames: new Set<string>() })
        },
        resetNewEventCount(): void {
          set({ newEventCount: 0 })
        },
        setSearchText(text: string): void {
          const { filters } = get()
          set({ filters: { ...filters, searchText: text } })
        },
        toggleEventNameFilter(eventName: string): void {
          const { filters } = get()
          const updated = new Set(filters.selectedEventNames)
          if (updated.has(eventName)) {
            updated.delete(eventName)
          } else {
            updated.add(eventName)
          }
          set({ filters: { ...filters, selectedEventNames: updated } })
        },
        addPropertyFilter(filter: PropertyFilter): void {
          const { filters } = get()
          set({ filters: { ...filters, propertyFilters: [...filters.propertyFilters, filter] } })
        },
        removePropertyFilter(index: number): void {
          const { filters } = get()
          const updated = [...filters.propertyFilters]
          updated.splice(index, 1)
          set({ filters: { ...filters, propertyFilters: updated } })
        },
        clearFilters(): void {
          set({
            filters: {
              searchText: '',
              selectedEventNames: new Set<string>(),
              propertyFilters: [],
            },
          })
        },
        setPosition(position: { x: number; y: number }): void {
          set({ position })
        },
        setSize(size: { width: number; height: number }): void {
          set({ size })
        },
      },
    }),
    {
      name: 'analyticsDebugStore',
      enabled: isDevEnv(),
    },
  ),
)

/** Creates an AnalyticsDebugBridge backed by this store. Call from the app layer to wire up explicitly. */
export function createAnalyticsDebugBridge(): AnalyticsDebugBridge {
  return {
    isEnabled: () => analyticsDebugStore.getState().enabled,
    addEvent: (event) => analyticsDebugStore.getState().actions.addEvent(event),
    enrichEvent: (match, metadata) =>
      analyticsDebugStore.getState().actions.enrichEventWithAmplitudeMetadata(match, metadata),
  }
}
