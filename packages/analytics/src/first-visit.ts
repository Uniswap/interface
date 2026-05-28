/**
 * First-Visit Attribution Capture
 *
 * Captures UTM params, referrer, browser, and country on the first visit.
 * Persists UTM in a cookie (first-touch attribution) and fires an Amplitude
 * `identify` call to set user properties.
 *
 * Called from the root loader — runs on every SSR page load but only
 * identifies when there's new attribution data to capture.
 */

import { getClientCountry } from './client-identity'
import type { AnalyticsService, UserTraits } from './service'
import { extractDomain, stripQueryParams } from './url-utils'

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const

export interface AttributionData {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  referrer?: string
  referringDomain?: string
  country?: string
  browser?: string
}

/**
 * Adapter for cookie parse/serialize — lets consumers bring their own
 * cookie implementation (react-router createCookie, hono cookie, etc.).
 */
export interface CookieAdapter {
  parse(cookieHeader: string | null): Promise<Record<string, string> | null>
  serialize(value: Record<string, string>): Promise<string>
}

/**
 * Parse browser family from User-Agent string.
 * Intentionally simple — covers the major browsers.
 */
function parseBrowser(ua: string): string {
  if (ua.includes('Edg/')) {
    return 'Edge'
  }
  if (ua.includes('OPR/') || ua.includes('Opera')) {
    return 'Opera'
  }
  if (ua.includes('Chrome/') && !ua.includes('Chromium/')) {
    return 'Chrome'
  }
  if (ua.includes('Firefox/')) {
    return 'Firefox'
  }
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    return 'Safari'
  }
  if (ua.includes('MSIE') || ua.includes('Trident/')) {
    return 'IE'
  }
  return 'Other'
}

interface AttributionTrackerDeps {
  analyticsService: AnalyticsService
  cookie: CookieAdapter
}

interface AttributionInput {
  request: Request
  userId: string | undefined
}

/**
 * Create an attribution tracker with the analytics service injected.
 *
 * The boundary (root loader) owns the wiring; the returned function
 * only takes per-request input. Returns a Set-Cookie header for UTM
 * persistence on first-touch, and fires an Amplitude identify call.
 */
export function createAttributionTracker({ analyticsService, cookie }: AttributionTrackerDeps) {
  return async ({ request, userId }: AttributionInput): Promise<{ setCookieHeader: string | null }> => {
    const url = new URL(request.url)
    const ua = request.headers.get('user-agent') ?? ''
    const referrer = request.headers.get('Referer') ?? undefined

    // Extract UTM from query params
    const utmData: Record<string, string> = {}
    for (const param of UTM_PARAMS) {
      const value = url.searchParams.get(param)
      if (value) {
        utmData[param] = value
      }
    }

    const hasUtm = Object.keys(utmData).length > 0
    const existingUtm = await cookie.parse(request.headers.get('Cookie'))
    const isFirstUtm = hasUtm && !existingUtm

    // Persist the first-touch UTM cookie even for anonymous visitors so
    // attribution survives the redirect through signup/login into the dashboard.
    const setCookieHeader = isFirstUtm ? await cookie.serialize(utmData) : null

    // Amplitude identify requires a userId — skip if we don't have one yet.
    // The cookie above still captures first-touch; a later authenticated request
    // picks it up via `existingUtm` below.
    if (!userId) {
      return { setCookieHeader }
    }

    // Build traits — setOnce in the service means these won't overwrite
    const traits: UserTraits = {}
    const country = getClientCountry(request)
    const browser = parseBrowser(ua)

    if (browser !== 'Other') {
      traits.browser = browser
    }
    if (country) {
      traits.country = country
    }
    if (referrer) {
      traits.referrer = stripQueryParams(referrer)
      traits.referringDomain = extractDomain(referrer)
    }

    // Prefer URL params; fall back to the cookie for users who arrived
    // anonymously and are now authenticated. setOnce on the service side
    // guarantees we never overwrite an earlier first-touch value.
    const utmSource = utmData['utm_source'] ?? existingUtm?.['utm_source']
    const utmMedium = utmData['utm_medium'] ?? existingUtm?.['utm_medium']
    const utmCampaign = utmData['utm_campaign'] ?? existingUtm?.['utm_campaign']
    const utmContent = utmData['utm_content'] ?? existingUtm?.['utm_content']

    if (utmSource) {
      traits.utmSource = utmSource
    }
    if (utmMedium) {
      traits.utmMedium = utmMedium
    }
    if (utmCampaign) {
      traits.utmCampaign = utmCampaign
    }
    if (utmContent) {
      traits.utmContent = utmContent
    }

    // Only identify if we have something meaningful to set
    const hasTraits = Object.keys(traits).length > 0
    if (hasTraits) {
      analyticsService.identify(userId, traits)
    }

    return { setCookieHeader }
  }
}
