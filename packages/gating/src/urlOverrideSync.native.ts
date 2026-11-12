import { getOverrideAdapter } from '@universe/gating/src/sdk/statsig'
import type { GatingSearchWriter } from '@universe/gating/src/urlOverrideSync'

/** Native has no page URL. */
export function getUrlWithGateOverrides(): string {
  return ''
}

/** Sets a local gate override; native has no URL to sync. */
export function overrideGateWithUrlSync({
  name,
  value,
}: {
  name: string
  value: boolean
  writeSearch: GatingSearchWriter
}): void {
  getOverrideAdapter().overrideGate(name, value)
}

/** Native has no URL to clear. */
export function clearGatingUrlParams(_writeSearch: GatingSearchWriter): void {}
