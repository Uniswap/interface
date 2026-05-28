// Traffic classification
export type { TrafficClassification, TrafficType } from './ai-traffic'
export { classifyTraffic, createAITrafficTracker } from './ai-traffic'

// Client identity (HTTP header extraction)
export type { ClientIdentityHeaders } from './client-identity'
export { extractClientIdentity, getClientCountry, getClientIp } from './client-identity'

// Context extraction
export { createServerContextExtractor } from './context'

// Attribution
export type { AttributionData, CookieAdapter } from './first-visit'
export { createAttributionTracker } from './first-visit'

// Service
export type { AnalyticsService, ServerEventContext, UserTraits } from './service'
export { AmplitudeAnalyticsService, NoopAnalyticsService } from './service'

// URL utilities
export { extractDomain, stripQueryParams } from './url-utils'
