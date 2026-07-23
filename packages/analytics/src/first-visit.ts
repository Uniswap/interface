/**
 * First-Visit Attribution Capture
 *
 * Captures UTM params, referrer, browser, and country. Persists UTM and referrer
 * in cookies (both first- and latest-touch) so attribution survives the anonymous
 * → authenticated handoff, then fires an Amplitude `identify` to set user
 * properties.
 *
 * Called from the root loader — runs on every SSR page load but only
 * identifies when there's a userId and something meaningful to set.
 */

import { getClientCountry } from './client-identity'
import type { AnalyticsService, UserTraits } from './service'
import { extractDomain, stripQueryParams } from './url-utils'

/**
 * The UTM params we capture, in one place: the cookie key (Amplitude-standard
 * snake_case) plus the camelCase `UserTraits` keys for latest- and first-touch.
 * Add a row and it flows through capture (`extractUtm`), the cookie merge
 * (`mergeUtmCookie`), and the identify traits (`utmTraits`) — nothing else to edit.
 */
const UTM_PARAMS = [
  { key: 'utm_source', latestTrait: 'utmSource', initialTrait: 'initialUtmSource' },
  { key: 'utm_medium', latestTrait: 'utmMedium', initialTrait: 'initialUtmMedium' },
  { key: 'utm_campaign', latestTrait: 'utmCampaign', initialTrait: 'initialUtmCampaign' },
  { key: 'utm_content', latestTrait: 'utmContent', initialTrait: 'initialUtmContent' },
] as const satisfies ReadonlyArray<{
  key: string
  latestTrait: keyof UserTraits
  initialTrait: keyof UserTraits
}>

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
  /** First-touch UTM cookie. */
  cookie: CookieAdapter
  /** Referrer attribution cookie — bridges the anonymous → authenticated gap, like UTM. */
  referrerCookie: CookieAdapter
}

interface AttributionInput {
  request: Request
  userId: string | undefined
}

/** A cross-origin referrer extracted from a request. */
interface ExternalReferral {
  referrer: string
  referringDomain: string
}

/**
 * Resolve the real (cross-origin) referrer for a request, or undefined.
 *
 * Two things are filtered out — both previously made every user look like they
 * came from developers.uniswap.org:
 *  - React Router `.data` loader fetches, whose Referer is always same-origin.
 *  - A Referer on our own host (internal navigation / post-login redirect).
 */
function resolveExternalReferral(url: URL, rawReferrer: string | undefined): ExternalReferral | undefined {
  if (url.pathname.endsWith('.data') || !rawReferrer) {
    return undefined
  }
  const referringDomain = extractDomain(rawReferrer)
  if (!referringDomain || referringDomain === url.hostname) {
    return undefined
  }
  return { referrer: stripQueryParams(rawReferrer) ?? rawReferrer, referringDomain }
}

/**
 * Merge a fresh external referral into the persisted cookie value: the latest
 * referral wins for `referrer`/`referring_domain`, while `initial_*` is sticky.
 */
function mergeReferrerCookie(
  external: ExternalReferral,
  existing: Record<string, string> | null,
): Record<string, string> {
  return {
    referrer: external.referrer,
    referring_domain: external.referringDomain,
    initial_referrer: existing?.['initial_referrer'] ?? external.referrer,
    initial_referring_domain: existing?.['initial_referring_domain'] ?? external.referringDomain,
  }
}

/**
 * Referrer cookie keys → `UserTraits` keys. referrer / referring_domain are
 * latest-touch (`set` in the service); initial_* are first-touch (`setOnce`).
 */
const REFERRER_TRAITS = [
  { key: 'referrer', trait: 'referrer' },
  { key: 'referring_domain', trait: 'referringDomain' },
  { key: 'initial_referrer', trait: 'initialReferrer' },
  { key: 'initial_referring_domain', trait: 'initialReferringDomain' },
] as const satisfies ReadonlyArray<{ key: string; trait: keyof UserTraits }>

/**
 * Referrer user-property traits from the persisted cookie value. All values are
 * external-only — never a self-referral.
 */
function referrerTraits(referrerData: Record<string, string> | null): UserTraits {
  const traits: UserTraits = {}
  if (!referrerData) {
    return traits
  }
  for (const { key, trait } of REFERRER_TRAITS) {
    const value = referrerData[key]
    if (value) {
      traits[trait] = value
    }
  }
  return traits
}

/** Extract UTM params present in the current request's query string. */
function extractUtm(url: URL): Record<string, string> {
  const utm: Record<string, string> = {}
  for (const { key } of UTM_PARAMS) {
    const value = url.searchParams.get(key)
    if (value) {
      utm[key] = value
    }
  }
  return utm
}

/**
 * Merge the current request's UTM into the persisted cookie value: the latest
 * campaign wins for `utm_*`, while `initial_utm_*` is sticky. Legacy cookies that
 * stored only the bare `utm_*` keys are migrated — that value seeds initial_*.
 */
function mergeUtmCookie(
  current: Record<string, string>,
  existing: Record<string, string> | null,
): Record<string, string> {
  const merged: Record<string, string> = {}
  for (const { key } of UTM_PARAMS) {
    const latest = current[key] ?? existing?.[key]
    if (latest) {
      merged[key] = latest
    }
    const initial = existing?.[`initial_${key}`] ?? existing?.[key] ?? current[key]
    if (initial) {
      merged[`initial_${key}`] = initial
    }
  }
  return merged
}

/**
 * UTM traits from the persisted cookie value. utm_* are latest-touch (`set` in
 * the service); initial_utm_* are first-touch (`setOnce`). The initial_* read
 * falls back to the bare key so legacy first-touch-only cookies still resolve.
 */
function utmTraits(utm: Record<string, string> | null): UserTraits {
  const traits: UserTraits = {}
  if (!utm) {
    return traits
  }
  for (const { key, latestTrait, initialTrait } of UTM_PARAMS) {
    const latest = utm[key]
    if (latest) {
      traits[latestTrait] = latest
    }
    const initial = utm[`initial_${key}`] ?? utm[key]
    if (initial) {
      traits[initialTrait] = initial
    }
  }
  return traits
}

/**
 * Create an attribution tracker with the analytics service injected.
 *
 * The boundary (root loader) owns the wiring; the returned function only takes
 * per-request input. It persists first-touch UTM and first/latest-touch referrer
 * cookies — so attribution survives the anonymous → authenticated handoff — and,
 * once a userId is known, fires an Amplitude identify call.
 */
export function createAttributionTracker({ analyticsService, cookie, referrerCookie }: AttributionTrackerDeps) {
  return async ({
    request,
    userId,
  }: AttributionInput): Promise<{ setCookieHeader: string | null; referrerCookieHeader: string | null }> => {
    const url = new URL(request.url)
    const cookieHeader = request.headers.get('Cookie')

    // --- UTM (first- and latest-touch) ---
    const currentUtm = extractUtm(url)
    const existingUtm = await cookie.parse(cookieHeader)
    const hasNewUtm = Object.keys(currentUtm).length > 0
    // Update the latest campaign (keeping the sticky first-touch) whenever new
    // params arrive; persist even for anonymous visitors so it survives login.
    const mergedUtm = hasNewUtm ? mergeUtmCookie(currentUtm, existingUtm) : existingUtm
    const setCookieHeader = hasNewUtm ? await cookie.serialize(mergedUtm ?? {}) : null

    // --- Referrer (first- and latest-touch) ---
    const existingReferrer = await referrerCookie.parse(cookieHeader)
    const external = resolveExternalReferral(url, request.headers.get('Referer') ?? undefined)

    // A fresh external referral wins; otherwise fall back to the persisted cookie
    // (which, like UTM, survives the anonymous → authenticated handoff).
    let referrerData = existingReferrer
    let referrerCookieHeader: string | null = null
    if (external) {
      const next = mergeReferrerCookie(external, existingReferrer)
      referrerData = next
      // Re-issue the cookie only when the value actually changed.
      const changed =
        existingReferrer?.['referrer'] !== next['referrer'] ||
        existingReferrer?.['initial_referring_domain'] !== next['initial_referring_domain']
      if (changed) {
        referrerCookieHeader = await referrerCookie.serialize(next)
      }
    }

    // Amplitude identify requires a userId — skip if we don't have one yet.
    // The cookies above still capture attribution; a later authenticated request
    // picks it up via `existingUtm` / `existingReferrer`.
    if (!userId) {
      return { setCookieHeader, referrerCookieHeader }
    }

    const traits: UserTraits = {
      ...referrerTraits(referrerData),
      ...utmTraits(mergedUtm),
    }
    const country = getClientCountry(request)
    const browser = parseBrowser(request.headers.get('user-agent') ?? '')
    if (browser !== 'Other') {
      traits.browser = browser
    }
    if (country) {
      traits.country = country
    }

    // Only identify if we have something meaningful to set
    if (Object.keys(traits).length > 0) {
      analyticsService.identify(userId, traits)
    }

    return { setCookieHeader, referrerCookieHeader }
  }
}
