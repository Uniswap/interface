import * as amplitude from '@amplitude/analytics-node'

export interface ServerEventContext {
  userId?: string
  deviceId?: string
  provider?: string
  language?: string
  country?: string
  referrer?: string
  referringDomain?: string
}

export interface UserTraits {
  loginMethod?: string
  apiKeyCount?: number
  browser?: string
  country?: string
  referrer?: string
  referringDomain?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
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

export class AmplitudeAnalyticsService<E extends string = string> implements AnalyticsService<E> {
  private static initialized = false
  private readonly platform: string

  constructor(apiKey: string, platform: string) {
    this.platform = platform

    // Amplitude's Node SDK is a singleton; subsequent instances share this initialization.
    if (!AmplitudeAnalyticsService.initialized) {
      amplitude.init(apiKey, { flushIntervalMillis: 10_000 })
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
    if (traits.loginMethod) {
      identifyEvent.set('loginMethod', traits.loginMethod)
    }
    if (traits.apiKeyCount !== undefined) {
      identifyEvent.set('apiKeyCount', traits.apiKeyCount)
    }
    if (traits.browser) {
      identifyEvent.set('browser', traits.browser)
    }
    if (traits.country) {
      identifyEvent.set('country', traits.country)
    }
    if (traits.referrer) {
      identifyEvent.setOnce('referrer', traits.referrer)
    }
    if (traits.referringDomain) {
      identifyEvent.setOnce('referringDomain', traits.referringDomain)
    }
    if (traits.utmSource) {
      identifyEvent.setOnce('utmSource', traits.utmSource)
    }
    if (traits.utmMedium) {
      identifyEvent.setOnce('utmMedium', traits.utmMedium)
    }
    if (traits.utmCampaign) {
      identifyEvent.setOnce('utmCampaign', traits.utmCampaign)
    }
    if (traits.utmContent) {
      identifyEvent.setOnce('utmContent', traits.utmContent)
    }
    if (traits.userId) {
      identifyEvent.set('user_id', traits.userId)
    }
    if (traits.orgId) {
      identifyEvent.set('org_id', traits.orgId)
    }
    if (traits.analyticsId) {
      identifyEvent.set('analytics_id', traits.analyticsId)
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
