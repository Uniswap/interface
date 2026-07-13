import * as amplitude from '@amplitude/analytics-node'

export interface ServerEventContext {
  userId?: string
  deviceId?: string
  provider?: string
  language?: string
  country?: string
}

export interface UserTraits {
  loginMethod?: string
  apiKeyCount?: number
  browser?: string
  country?: string
  /** Most recent external referrer URL (latest-touch). */
  referrer?: string
  /** Most recent external referring domain (latest-touch). */
  referringDomain?: string
  /** First external referrer URL ever seen for this user (first-touch, set-once). */
  initialReferrer?: string
  /** First external referring domain ever seen for this user (first-touch, set-once). */
  initialReferringDomain?: string
  /** Most recent UTM params (latest-touch). */
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  /** First UTM params ever seen for this user (first-touch, set-once). */
  initialUtmSource?: string
  initialUtmMedium?: string
  initialUtmCampaign?: string
  initialUtmContent?: string
  /** Backend user UUID — duplicated as a user property so it's queryable in Amplitude. */
  userId?: string
  /** Backend organization UUID. */
  orgId?: string
  /** Backend analytics UUID written on account creation. */
  analyticsId?: string
}

export interface AnalyticsService<E extends string = string> {
  track(event: E, properties: Record<string, unknown>, serverContext: ServerEventContext): void
  identify(userId: string, traits: UserTraits): void
  flush(): Promise<void>
}

/** `set` = latest-touch (overwrites every visit); `setOnce` = first-touch (locked on first write). */
type IdentifyMode = 'set' | 'setOnce'

/**
 * Every user property `identify` writes, in one place: the `UserTraits` key, the
 * Amplitude property name, and the write mode. Property keys are Amplitude-standard
 * snake_case to match the web app (the two leading camelCase keys are legacy).
 *
 * referrer / referring_domain are `set`, not `setOnce`: they were `setOnce`, which
 * locked the first value — and because the first value was always the internal
 * post-login redirect, every user looked like they came from developers.uniswap.org.
 */
const TRAIT_MAPPINGS: ReadonlyArray<{ trait: keyof UserTraits; property: string; mode: IdentifyMode }> = [
  { trait: 'loginMethod', property: 'loginMethod', mode: 'set' },
  { trait: 'apiKeyCount', property: 'apiKeyCount', mode: 'set' },
  { trait: 'browser', property: 'browser', mode: 'set' },
  { trait: 'country', property: 'country', mode: 'set' },
  { trait: 'referrer', property: 'referrer', mode: 'set' },
  { trait: 'referringDomain', property: 'referring_domain', mode: 'set' },
  { trait: 'initialReferrer', property: 'initial_referrer', mode: 'setOnce' },
  { trait: 'initialReferringDomain', property: 'initial_referring_domain', mode: 'setOnce' },
  { trait: 'utmSource', property: 'utm_source', mode: 'set' },
  { trait: 'utmMedium', property: 'utm_medium', mode: 'set' },
  { trait: 'utmCampaign', property: 'utm_campaign', mode: 'set' },
  { trait: 'utmContent', property: 'utm_content', mode: 'set' },
  { trait: 'initialUtmSource', property: 'initial_utm_source', mode: 'setOnce' },
  { trait: 'initialUtmMedium', property: 'initial_utm_medium', mode: 'setOnce' },
  { trait: 'initialUtmCampaign', property: 'initial_utm_campaign', mode: 'setOnce' },
  { trait: 'initialUtmContent', property: 'initial_utm_content', mode: 'setOnce' },
  { trait: 'userId', property: 'user_id', mode: 'set' },
  { trait: 'orgId', property: 'org_id', mode: 'set' },
  { trait: 'analyticsId', property: 'analytics_id', mode: 'set' },
]

export class AmplitudeAnalyticsService<E extends string = string> implements AnalyticsService<E> {
  private static initialized = false
  private readonly platform: string

  constructor(apiKey: string, platform: string) {
    this.platform = platform

    // Amplitude's Node SDK is a singleton; subsequent instances share this initialization.
    if (!AmplitudeAnalyticsService.initialized) {
      // flushQueueSize: 1 makes the SDK fire each event's network POST in the
      // background immediately, instead of waiting up to flushIntervalMillis.
      // This shrinks the window where a frozen/recycled serverless process drops
      // queued events. (Guaranteed at-least-once on Vercel would need waitUntil.)
      amplitude.init(apiKey, { flushIntervalMillis: 10_000, flushQueueSize: 1 })
      AmplitudeAnalyticsService.initialized = true
    }
  }

  // oxlint-disable-next-line max-params
  track(event: E, properties: Record<string, unknown>, serverContext: ServerEventContext): void {
    amplitude.track({
      event_type: event,
      event_properties: { ...properties },
      user_id: serverContext.userId,
      device_id: serverContext.deviceId,
      language: serverContext.language,
      platform: this.platform,
      user_properties: serverContext.provider ? { provider: serverContext.provider } : undefined,
    })
  }

  identify(userId: string, traits: UserTraits): void {
    const identifyEvent = new amplitude.Identify()
    for (const { trait, property, mode } of TRAIT_MAPPINGS) {
      const value = traits[trait]
      // Skip absent traits — `''` counts as absent, but numeric `0` (apiKeyCount) is kept.
      if (value === undefined || value === '') {
        continue
      }
      identifyEvent[mode](property, value)
    }
    amplitude.identify(identifyEvent, { user_id: userId })
  }

  async flush(): Promise<void> {
    await amplitude.flush()
  }
}

export class NoopAnalyticsService implements AnalyticsService {
  track(): void {
    // No-op
  }
  identify(): void {
    // No-op
  }
  async flush(): Promise<void> {
    // No-op
  }
}
