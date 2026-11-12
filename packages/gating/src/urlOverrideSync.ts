import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * Writes a query string (`?a=b`, or `''` for none) to the page URL. Web callers pass their router's
 * replace-navigation so the router sees the change; a shallow history write would leave it stale.
 */
export type GatingSearchWriter = (search: string) => void

/** The current page URL with every active gate override as `featureFlagOverride` / `featureFlagOverrideOff`. */
export function getUrlWithGateOverrides(): string {
  throw new PlatformSplitStubError('getUrlWithGateOverrides')
}

/** Sets a local gate override, then hands `writeSearch` the query whose gate params match all gate overrides. */
export function overrideGateWithUrlSync(_params: {
  name: string
  value: boolean
  writeSearch: GatingSearchWriter
}): void {
  throw new PlatformSplitStubError('overrideGateWithUrlSync')
}

/** Hands `writeSearch` the current query without any gating override param, so a reload doesn't re-apply them. */
export function clearGatingUrlParams(_writeSearch: GatingSearchWriter): void {
  throw new PlatformSplitStubError('clearGatingUrlParams')
}
