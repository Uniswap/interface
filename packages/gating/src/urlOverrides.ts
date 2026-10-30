/**
 * Query-param gating overrides, shared by apps/web (useFeatureFlagUrlOverrides)
 * and pools.xyz (apps/pools-xyz). Every param is a comma-separated list:
 *
 *   featureFlagOverride=a,b          gates a and b → on
 *   featureFlagOverrideOff=c         gate c → off
 *   experimentOverride=exp:group     assigned group (dynamic-config override `{ group }`)
 *   experimentOverride=exp:param:v   one experiment param; `v` parses as true/false/number, else string
 *   layerOverride=layer:param        layer param → true
 *   layerOverrideOff=layer:param     layer param → false
 *
 * Parsing is split from applying so the same parser feeds a `qs`-parsed
 * query (web) and a `URLSearchParams` (rh-cca), and so it unit-tests without a
 * Statsig client. Either way a param counts only when it appears exactly once
 * as a plain string: `qs` turns a repeated param into an array, which has
 * always been ignored, and the `URLSearchParams` leg applies the same rule.
 */

export const GATING_URL_PARAMS = {
  gatesOn: 'featureFlagOverride',
  gatesOff: 'featureFlagOverrideOff',
  experiments: 'experimentOverride',
  layersOn: 'layerOverride',
  layersOff: 'layerOverrideOff',
} as const

export interface GatingUrlOverrides {
  gates: Array<{ name: string; value: boolean }>
  experimentGroups: Array<{ name: string; group: string }>
  experimentParams: Array<{ name: string; param: string; value: boolean | number | string }>
  layers: Array<{ name: string; param: string; value: boolean }>
}

/** The subset of LocalOverrideAdapter the URL overrides write through. */
export interface GatingOverrideTarget {
  overrideGate(name: string, value: boolean): void
  overrideDynamicConfig(name: string, value: Record<string, unknown>): void
  overrideExperiment(name: string, value: Record<string, unknown>): void
  overrideLayer(name: string, value: Record<string, unknown>): void
}

function parseExperimentOverrideValue(value: string): boolean | number | string {
  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }
  const asNumber = Number(value)
  return value.length > 0 && !Number.isNaN(asNumber) ? asNumber : value
}

/** A `qs.parse` result (web) or the query itself as `URLSearchParams` (rh-cca). */
export type GatingUrlParams = URLSearchParams | Record<string, unknown>

// Duck-typed rather than `instanceof`: the global need not exist where this module loads (native).
function isSearchParams(params: GatingUrlParams): params is URLSearchParams {
  return typeof (params as URLSearchParams).getAll === 'function'
}

/** The param's value when it appears exactly once as a string; a repeated, absent or nested param reads as unset. */
function readParam(params: GatingUrlParams, key: string): string | undefined {
  if (isSearchParams(params)) {
    const values = params.getAll(key)
    return values.length === 1 ? values[0] : undefined
  }
  const raw = params[key]
  return typeof raw === 'string' ? raw : undefined
}

function readList(params: GatingUrlParams, key: string): string[] {
  const raw = readParam(params, key)
  if (raw === undefined) {
    return []
  }
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

export function parseGatingUrlOverrides(params: GatingUrlParams): GatingUrlOverrides {
  const overrides: GatingUrlOverrides = { gates: [], experimentGroups: [], experimentParams: [], layers: [] }

  for (const name of readList(params, GATING_URL_PARAMS.gatesOn)) {
    overrides.gates.push({ name, value: true })
  }
  for (const name of readList(params, GATING_URL_PARAMS.gatesOff)) {
    overrides.gates.push({ name, value: false })
  }

  for (const entry of readList(params, GATING_URL_PARAMS.experiments)) {
    const [name, paramOrGroup, ...valueParts] = entry.split(':')
    if (!name || !paramOrGroup) {
      continue
    }
    if (valueParts.length > 0) {
      // Values may themselves contain ':' (URLs), so everything past the second separator is the value.
      overrides.experimentParams.push({
        name,
        param: paramOrGroup,
        value: parseExperimentOverrideValue(valueParts.join(':')),
      })
    } else {
      overrides.experimentGroups.push({ name, group: paramOrGroup })
    }
  }

  const readLayers = (key: string, value: boolean): void => {
    for (const entry of readList(params, key)) {
      const [name, param] = entry.split(':')
      if (name && param) {
        overrides.layers.push({ name, param, value })
      }
    }
  }
  readLayers(GATING_URL_PARAMS.layersOn, true)
  readLayers(GATING_URL_PARAMS.layersOff, false)

  return overrides
}

/** One params object per name, in first-seen order, so the adapter (which assigns, not merges) gets every param at once. */
function groupParamsByName(
  entries: Array<{ name: string; param: string; value: unknown }>,
): Map<string, Record<string, unknown>> {
  const grouped = new Map<string, Record<string, unknown>>()
  for (const { name, param, value } of entries) {
    const params = grouped.get(name) ?? {}
    params[param] = value
    grouped.set(name, params)
  }
  return grouped
}

export function applyGatingUrlOverrides(overrides: GatingUrlOverrides, target: GatingOverrideTarget): void {
  for (const { name, value } of overrides.gates) {
    target.overrideGate(name, value)
  }
  for (const { name, group } of overrides.experimentGroups) {
    target.overrideDynamicConfig(name, { group })
  }
  for (const [name, params] of groupParamsByName(overrides.experimentParams)) {
    target.overrideExperiment(name, params)
  }
  for (const [name, params] of groupParamsByName(overrides.layers)) {
    target.overrideLayer(name, params)
  }
}
