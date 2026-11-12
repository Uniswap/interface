import { getOverrideAdapter } from '@universe/gating/src/sdk/statsig'
import {
  serializeGatingSearchParams,
  withGateOverrideParams,
  withoutGatingUrlParams,
} from '@universe/gating/src/urlOverrides'
import type { GatingSearchWriter } from '@universe/gating/src/urlOverrideSync'
import { namedOverrideEntries } from '@universe/gating/src/utils'

function getGateOverrides(): Array<[string, boolean]> {
  return namedOverrideEntries(getOverrideAdapter().getAllOverrides().gate)
}

function nextSearch(update: (params: URLSearchParams) => URLSearchParams): string {
  const search = serializeGatingSearchParams(update(new URLSearchParams(window.location.search)))
  return search ? `?${search}` : ''
}

/** The current page URL with every active gate override as `featureFlagOverride` / `featureFlagOverrideOff`. */
export function getUrlWithGateOverrides(): string {
  const gates = getGateOverrides()
  const url = new URL(window.location.href)
  url.search = nextSearch((params) => withGateOverrideParams(params, gates))
  return url.toString()
}

/** Sets a local gate override, then hands `writeSearch` the query whose gate params match all gate overrides. */
export function overrideGateWithUrlSync({
  name,
  value,
  writeSearch,
}: {
  name: string
  value: boolean
  writeSearch: GatingSearchWriter
}): void {
  getOverrideAdapter().overrideGate(name, value)
  const gates = getGateOverrides()
  writeSearch(nextSearch((params) => withGateOverrideParams(params, gates)))
}

/** Hands `writeSearch` the current query without any gating override param, so a reload doesn't re-apply them. */
export function clearGatingUrlParams(writeSearch: GatingSearchWriter): void {
  writeSearch(nextSearch(withoutGatingUrlParams))
}
