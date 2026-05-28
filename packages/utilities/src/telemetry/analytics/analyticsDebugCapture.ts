export interface AnalyticsDebugBridge {
  isEnabled: () => boolean
  addEvent: (event: {
    timestamp: Date
    eventName: string
    customProperties: Record<string, unknown>
    traceProperties: Record<string, unknown>
  }) => void
  enrichEvent: (match: { eventName: string; timestamp: Date }, metadata: Record<string, unknown>) => void
}

const TRACE_CONTEXT_KEYS = new Set(['page', 'screen', 'section', 'modal', 'element'])

/**
 * Captures an analytics event for the debug overlay (Tier 1 + 2).
 * Separates trace context properties from custom properties.
 * Called from analytics.web.ts sendEvent after logging.
 */
export function captureAnalyticsDebugEvent({
  bridge,
  eventName,
  properties,
}: {
  bridge: AnalyticsDebugBridge | undefined
  eventName: string
  properties?: Record<string, unknown>
}): void {
  if (!bridge?.isEnabled()) {
    return
  }

  const customProperties: Record<string, unknown> = {}
  const traceProperties: Record<string, unknown> = {}

  if (properties) {
    for (const [key, value] of Object.entries(properties)) {
      if (TRACE_CONTEXT_KEYS.has(key)) {
        traceProperties[key] = value
      } else {
        customProperties[key] = value
      }
    }
  }

  bridge.addEvent({
    timestamp: new Date(),
    eventName,
    customProperties,
    traceProperties,
  })
}

/**
 * Captures Amplitude transport payload metadata for the debug overlay (Tier 3).
 * Called from ApplicationTransport.send before the fetch call.
 * Enriches previously captured events with device/session/platform metadata.
 */
export function captureAmplitudeTransportPayload({
  bridge,
  events,
}: {
  bridge: AnalyticsDebugBridge | undefined
  events: unknown
}): void {
  if (!bridge?.isEnabled()) {
    return
  }

  if (!Array.isArray(events)) {
    return
  }

  for (const event of events) {
    if (!event || typeof event !== 'object') {
      continue
    }

    const { event_type, time, ...rest } = event as Record<string, unknown>

    if (typeof event_type !== 'string') {
      continue
    }

    // Extract useful metadata fields
    const metadata: Record<string, unknown> = {}
    const metadataKeys = [
      'device_id',
      'session_id',
      'os_name',
      'os_version',
      'platform',
      'language',
      'user_properties',
      'device_model',
      'device_brand',
      'carrier',
      'country',
      'region',
      'city',
      'library',
      'ip',
    ]

    for (const key of metadataKeys) {
      if (key in rest && rest[key] !== undefined) {
        metadata[key] = rest[key]
      }
    }

    if (Object.keys(metadata).length > 0) {
      const timestamp = typeof time === 'number' ? new Date(time) : new Date()
      bridge.enrichEvent({ eventName: event_type, timestamp }, metadata)
    }
  }
}
