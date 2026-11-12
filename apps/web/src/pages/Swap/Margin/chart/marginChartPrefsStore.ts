import { getKeys } from 'utilities/src/primitives/objects'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Chart display preferences (spec F14). Persisted so a trader's chart style survives reloads.
export interface MarginChartPrefs {
  chartStyle: 'candles' | 'line'
}

export const DEFAULT_MARGIN_CHART_PREFS: MarginChartPrefs = {
  chartStyle: 'candles',
}

interface MarginChartPrefsState extends MarginChartPrefs {
  setChartPrefs: (partial: Partial<MarginChartPrefs>) => void
}

// Keep only known keys whose persisted value type matches the default's; drop foreign keys and
// mistyped values so a corrupted payload can't rehydrate (falls back to the default via merge).
function pruneToKnownPrefs(persisted: unknown): Partial<MarginChartPrefs> {
  if (!persisted || typeof persisted !== 'object') {
    return {}
  }
  const source = persisted as Record<string, unknown>
  const known: Partial<Record<keyof MarginChartPrefs, unknown>> = {}
  for (const key of getKeys(DEFAULT_MARGIN_CHART_PREFS)) {
    if (key in source && typeof source[key] === typeof DEFAULT_MARGIN_CHART_PREFS[key]) {
      known[key] = source[key]
    }
  }
  return known as Partial<MarginChartPrefs>
}

export const useMarginChartPrefs = create<MarginChartPrefsState>()(
  persist(
    (set) => ({
      ...DEFAULT_MARGIN_CHART_PREFS,
      setChartPrefs: (partial) => set(partial),
    }),
    {
      name: 'margin.chartPrefs.v1',
      version: 1,
      // zustand's `migrate` never runs for a same-version payload, so pruning stale keys must live
      // in `merge`: layer only keys still in the default shape over the live defaults, dropping the
      // rest. Spreading `current` first also carries the action across a rehydrate replace.
      merge: (persisted, current) => ({ ...current, ...pruneToKnownPrefs(persisted) }),
    },
  ),
)
