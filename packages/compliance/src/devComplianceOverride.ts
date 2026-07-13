import { GatedFeature, RestrictionReason } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_pb'
import { isProdEnv } from '@universe/environment'
import { useSyncExternalStore } from 'react'

/**
 * Dev-only override for the compliance read hooks. Region is server-resolved from
 * GeoIP and no client header changes it, so this can only mock what the hooks
 * return, not the region the server sees. Hard-gated to non-prod; persisted on
 * web/extension (localStorage), in-memory on native.
 */

/** Checkbox options, derived from the proto enums so new values appear automatically. */
export const GATED_FEATURE_OPTIONS: { value: GatedFeature; label: string }[] = Object.values(GatedFeature)
  .filter((v): v is GatedFeature => typeof v === 'number' && v !== GatedFeature.UNSPECIFIED)
  .map((value) => ({ value, label: GatedFeature[value] }))

export const RESTRICTION_REASON_OPTIONS: { value: RestrictionReason; label: string }[] = Object.values(
  RestrictionReason,
)
  .filter((v): v is RestrictionReason => typeof v === 'number' && v !== RestrictionReason.UNSPECIFIED)
  .map((value) => ({ value, label: RestrictionReason[value] }))

type OverrideState = {
  enabled: boolean
  /** Blocked features. Empty = nothing gated; the UI checks a feature when it is NOT here. */
  gatedFeatures: GatedFeature[]
  /** Reasons applied to every token (checked = restricted). */
  tokenReasons: RestrictionReason[]
}

const EMPTY_STATE: OverrideState = { enabled: false, gatedFeatures: [], tokenReasons: [] }
const STORAGE_KEY = 'dev:compliance:override'

function readPersisted(): OverrideState {
  try {
    if (typeof localStorage === 'undefined') {
      return { ...EMPTY_STATE }
    }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { ...EMPTY_STATE }
    }
    const parsed = JSON.parse(raw) as Partial<OverrideState>
    return {
      enabled: Boolean(parsed.enabled),
      gatedFeatures: Array.isArray(parsed.gatedFeatures) ? parsed.gatedFeatures : [],
      tokenReasons: Array.isArray(parsed.tokenReasons) ? parsed.tokenReasons : [],
    }
  } catch {
    return { ...EMPTY_STATE }
  }
}

function writePersisted(next: OverrideState): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }
  } catch {
    // storage unavailable (private mode, quota) — override just won't persist
  }
}

let state: OverrideState = readPersisted()
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function setState(next: OverrideState): void {
  state = next
  writePersisted(state)
  listeners.forEach((listener) => listener())
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export function setComplianceOverrideEnabled(enabled: boolean): void {
  setState({ ...state, enabled })
}

export function toggleFeatureGated(feature: GatedFeature): void {
  setState({ ...state, gatedFeatures: toggle(state.gatedFeatures, feature) })
}

export function toggleTokenReasonOverride(reason: RestrictionReason): void {
  setState({ ...state, tokenReasons: toggle(state.tokenReasons, reason) })
}

export function clearComplianceOverrides(): void {
  setState({ ...EMPTY_STATE })
}

function getSnapshot(): OverrideState {
  return state
}

export function getComplianceOverrideState(): OverrideState {
  return state
}

/** Blocked features to report, or `undefined` to pass through (off or prod). */
export function resolveGatedFeaturesOverride(s: OverrideState): GatedFeature[] | undefined {
  return isProdEnv() || !s.enabled ? undefined : s.gatedFeatures
}

/** Token reasons to report, or `undefined` to pass through (off or prod). */
export function resolveTokenReasonsOverride(s: OverrideState): RestrictionReason[] | undefined {
  return isProdEnv() || !s.enabled ? undefined : s.tokenReasons
}

export function useComplianceOverrideEnabled(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot().enabled,
    () => getSnapshot().enabled,
  )
}

export function useGatedFeatureSet(): GatedFeature[] {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot().gatedFeatures,
    () => getSnapshot().gatedFeatures,
  )
}

export function useOverriddenTokenReasons(): RestrictionReason[] {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot().tokenReasons,
    () => getSnapshot().tokenReasons,
  )
}

export function useGatedFeaturesOverride(): GatedFeature[] | undefined {
  return resolveGatedFeaturesOverride(useSyncExternalStore(subscribe, getSnapshot, getSnapshot))
}

export function useTokenReasonsOverride(): RestrictionReason[] | undefined {
  return resolveTokenReasonsOverride(useSyncExternalStore(subscribe, getSnapshot, getSnapshot))
}
